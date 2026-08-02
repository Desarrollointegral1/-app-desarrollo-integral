// ============================================================
// EDGE FUNCTION auth-bridge — puente de login por codigo+PIN
// ============================================================
// Corre con SUPABASE_SERVICE_ROLE_KEY (server-side). Dos acciones:
//   - login: valida codigo+PIN con verify_login_pin (bcrypt), y si es correcto
//     genera un magiclink y devuelve token_hash para que el cliente lo canjee
//     con verifyOtp() → sesion real de Supabase Auth. El PIN NUNCA se valida
//     en el cliente. Rate-limit con backoff exponencial por codigo.
//   - provision: SOLO admin (valida el JWT del que llama). Crea el user de Auth
//     del alumno/admin, linkea alumnos/admins.user_id y setea el pin bcrypt.
//
// verify_jwt = false a proposito: la accion 'login' se llama sin sesion.
// La autorizacion de 'provision' se hace adentro (chequea app_metadata.role).
//
// Este archivo es la COPIA VERSIONADA del codigo desplegado (version 7,
// auditoria 2026-08-02). La fuente de verdad es la Edge Function en Supabase;
// mantener este archivo en sync al cambiarla.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { action, codigo, pin, tipo, alumnoId, id } = await req.json();

    if (action === 'login') {
      if (!codigo || !pin) return json({ error: 'Faltan datos' }, 400);
      const cod = String(codigo).trim();
      const rol = tipo === 'admin' ? 'admin' : 'alumno';
      // Backoff exponencial (auditoria 2026-08-02): en vez de una ventana fija
      // de 15 min (960 intentos/dia contra una cuenta), la ventana crece con
      // los fallos acumulados en 24h: 15min -> 30 -> 60 -> ... -> tope 4h. Un
      // usuario legitimo (0-2 fallos) NUNCA se ve afectado; el bloqueo recien
      // aparece a partir de 10 fallos.
      const desde24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await admin.from('login_attempts').delete().lt('at', desde24h);
      const { count } = await admin.from('login_attempts')
        .select('*', { count: 'exact', head: true }).ilike('codigo', cod).gte('at', desde24h);
      const fallos = count ?? 0;
      if (fallos >= 10) {
        const bloques = Math.floor(fallos / 10);
        const ventanaMin = Math.min(15 * 2 ** (bloques - 1), 240);
        const { data: ult } = await admin.from('login_attempts')
          .select('at').ilike('codigo', cod).order('at', { ascending: false }).limit(1);
        const ultMs = ult?.[0]?.at ? new Date(ult[0].at as string).getTime() : 0;
        if (Date.now() - ultMs < ventanaMin * 60 * 1000) {
          return json({ error: 'Demasiados intentos. Espera un rato y volve a probar.' }, 429);
        }
      }

      const { data: email, error } = await admin.rpc('verify_login_pin', { p_codigo: cod, p_pin: String(pin), p_tipo: rol });
      if (error) return json({ error: error.message }, 500);
      if (!email) {
        await admin.from('login_attempts').insert({ codigo: cod });
        return json({ error: rol === 'admin' ? 'Codigo admin o PIN invalido' : 'Codigo o PIN invalido' }, 401);
      }
      await admin.from('login_attempts').delete().ilike('codigo', cod);
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: email as string });
      if (linkErr || !link?.properties?.hashed_token) return json({ error: linkErr?.message || 'No se pudo generar la sesion' }, 500);
      return json({ ok: true, token_hash: link.properties.hashed_token });
    }

    if (action === 'provision') {
      // Operacion privilegiada: SOLO admin (valida el JWT de sesion del que llama)
      const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: caller } = await admin.auth.getUser(jwt);
      const callerRole = (caller?.user?.app_metadata as Record<string, unknown> | undefined)?.role;
      if (callerRole !== 'admin') return json({ error: 'Solo un admin puede hacer esto' }, 403);

      const rol = tipo === 'admin' ? 'admin' : 'alumno';
      const tabla = rol === 'admin' ? 'admins' : 'alumnos';
      const rid = alumnoId ?? id;
      if (!rid || !pin) return json({ error: 'Faltan datos' }, 400);
      const { data: row, error: rowErr } = await admin.from(tabla).select('id, user_id').eq('id', rid).single();
      if (rowErr || !row) return json({ error: 'Registro no encontrado' }, 404);
      let userId = row.user_id as string | null;
      if (!userId) {
        const email = `${row.id}@${tabla}.di.local`;
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email, email_confirm: true,
          password: crypto.randomUUID() + crypto.randomUUID(),
          app_metadata: { role: rol },
        });
        if (cErr) return json({ error: cErr.message }, 500);
        userId = created.user!.id;
        await admin.from(tabla).update({ user_id: userId }).eq('id', row.id);
      }
      await admin.rpc('set_pin_bcrypt_tabla', { p_tabla: tabla, p_id: row.id, p_pin: String(pin) });
      return json({ ok: true, user_id: userId });
    }

    return json({ error: 'Accion invalida' }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
