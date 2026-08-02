-- Corrección del trigger 028: la versión anterior congelaba user_id/pin
-- también para service_role (sin JWT → is_admin() false). auth-bridge linkea
-- alumnos.user_id en el primer login CON service_role — congelarlo habría
-- roto el provisioning. Ahora solo se congela para usuarios 'authenticated'
-- que no son admin (el alumno en el navegador). service_role (role claim
-- 'service_role') y las conexiones directas pasan sin restricción.
-- Verificado 2026-08-02: alumno authenticated puede escribir diario/asistencia
-- pero no puede tocar user_id/pin; service_role no queda bloqueado.
create or replace function public.alumnos_congelar_identidad()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if (auth.jwt() ->> 'role') = 'authenticated' and not public.is_admin() then
    new.user_id    := old.user_id;
    new.pin_hash   := old.pin_hash;
    new.pin_bcrypt := old.pin_bcrypt;
  end if;
  return new;
end; $$;
