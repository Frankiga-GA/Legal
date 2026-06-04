-- ============================================================================
-- Migración: agregar columna `counterparty` a la tabla `cases`
-- ============================================================================
-- El frontend ahora guarda la contraparte del caso (opcional) cuando se crea
-- un expediente, pero la columna no existía en la tabla. Se agrega como
-- TEXT NULL (sin default para no reescribir las filas existentes).
-- ============================================================================

begin;

alter table public.cases
  add column if not exists counterparty text;

commit;
