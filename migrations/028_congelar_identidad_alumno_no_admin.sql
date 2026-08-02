-- Auditoría 2026-08-02, Hallazgo 5 (versión segura): la RLS permite al alumno
-- update sobre TODAS sus columnas (guardarDatos hace un upsert de la fila
-- completa desde el navegador). Congelar rm/asistencia/bioimpedancia/diario
-- rompería el flujo del alumno (marca su propia asistencia, diario, RM), así
-- que NO se tocan acá — eso pide el refactor de _guardarAlumno (Fase 4).
-- Lo que SÍ es seguro y cierra el secuestro de cuenta: congelar las columnas
-- de identidad/credenciales, que el cliente del alumno nunca manda en su
-- payload. Un alumno malicioso ya no puede reasignarse user_id ni tocar su
-- hash de PIN con un update directo.
-- NOTA: reemplazada de inmediato por 029 (esta versión también congelaba a
-- service_role y habría roto el provisioning de auth-bridge). Se deja por
-- fidelidad con el historial aplicado.
create or replace function public.alumnos_congelar_identidad()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if not public.is_admin() then
    new.user_id    := old.user_id;
    new.pin_hash   := old.pin_hash;
    new.pin_bcrypt := old.pin_bcrypt;
  end if;
  return new;
end; $$;

drop trigger if exists trg_alumnos_congelar_identidad on public.alumnos;
create trigger trg_alumnos_congelar_identidad
  before update on public.alumnos
  for each row execute function public.alumnos_congelar_identidad();
