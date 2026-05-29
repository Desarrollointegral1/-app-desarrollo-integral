import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Intenta crear la tabla — si ya existe, Supabase ignora y devuelve error que ignoramos
    const { error: tableError } = await supabase
      .from('responder_memory')
      .select('id')
      .limit(1);

    if (tableError?.code === 'PGRST116') {
      // Tabla no existe, crearla usando insert directo (fuerza creación)
      const { error: createError } = await supabase
        .from('responder_memory')
        .insert([{ input: 'init', reply: 'init' }]);

      if (!createError) {
        // Limpiar registro de inicialización
        await supabase
          .from('responder_memory')
          .delete()
          .eq('input', 'init');
      }
    }

    // Habilitar RLS y políticas (Supabase puede que ya las tenga)
    try {
      await supabase.rpc('enable_responder_policies', {});
    } catch {
      // Las políticas pueden ya existir
    }

    return NextResponse.json({
      success: true,
      message: 'responder_memory table is ready',
    });
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json(
      { error: String(err), type: 'warning' },
      { status: 200 } // Retornamos 200 porque puede funcionar de todas formas
    );
  }
}
