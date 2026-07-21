-- ============================================================================
-- 011 — Códigos de ejercicio (M/E/C/P) + backfill en biblioteca_ejercicios
--
-- Contexto (ronda 11, 2026-07-21):
-- Cada ejercicio de la biblioteca/templates pasa a tener un CÓDIGO estable,
-- prefijado por categoría: M=Movilidad, E=Act. Elástico, C=Entrada en
-- calor/activación con peso, P=Principales. Los códigos "oficiales" (los que
-- vienen de las rutinas curadas de Lucas) se definen en
-- src/utils/planTemplates.js (fuente de verdad, ver bloque "CÓDIGOS DE
-- EJERCICIO" al final del archivo) y se propagan acá a biblioteca_ejercicios
-- por nombre normalizado (sin acentos/mayúsculas/paréntesis).
--
-- De 108 filas existentes en biblioteca_ejercicios, 65 matchearon un
-- ejercicio oficial de planTemplates.js (mismo código M/E/C/P). Las otras 43
-- son ejercicios que Lucas fue agregando a mano desde el admin y no tienen
-- equivalente exacto en el contenido oficial (incluye "Remo a un brazo
-- (banda)", que normaliza igual que "Remo a un brazo" pero es una variante
-- distinta con elástico) — se les asignó un código correlativo con prefijo
-- X (X01..X43) para que TODOS los ejercicios de la
-- biblioteca tengan algún código, sin inventarles una categoría M/E/C/P que
-- no les corresponde. Si en el futuro se decide que alguno de esos "X" es
-- en realidad la misma rutina que uno oficial (ej. nombre distinto por
-- tipeo), se puede recodificar a mano con un UPDATE puntual.
--
-- plan_ejercicios (Principales, normalizado) también suma la columna
-- codigo: se completa desde la app en cada guardado nuevo (services/
-- supabase.js). Los 72 ejercicios YA asignados a alumnos reales (Agustina/
-- Franco/Lucas Verissimo) al momento de esta migración se backfillearon acá
-- mismo por nombre EXACTO (20 nombres distintos: 16 matchean un código
-- oficial P/M/E/C, 4 son nombres viejos de rondas anteriores que ya no
-- existen en planTemplates.js — "Fuerza con impulso con barra", "Hip
-- Thrust bilateral", "Jalon al pecho / Maquina dorsales", "Pecho plano con
-- barra" — y reusan el MISMO código X que ya tenían en biblioteca_ejercicios
-- para esos mismos nombres, así el código es consistente entre las dos
-- tablas). Verificado: 72/72 filas de plan_ejercicios con código después.
-- ============================================================================

ALTER TABLE IF EXISTS biblioteca_ejercicios
ADD COLUMN IF NOT EXISTS codigo text;

ALTER TABLE IF EXISTS plan_ejercicios
ADD COLUMN IF NOT EXISTS codigo text;

-- Índice único parcial: dos ejercicios oficiales nunca deberían compartir
-- código (los X sí podrían si se recodifican a mano, así que no se fuerza
-- unicidad total — solo evita duplicados silenciosos en el uso normal).
CREATE UNIQUE INDEX IF NOT EXISTS biblioteca_ejercicios_codigo_idx
  ON biblioteca_ejercicios (codigo) WHERE codigo IS NOT NULL;

-- Backfill: 65 matches oficiales (M/E/C/P) + 43 fallback (X01..X43).
UPDATE biblioteca_ejercicios SET codigo='M08' WHERE id='4fc62582-cef6-4643-96fc-ee69045ceb9b';
UPDATE biblioteca_ejercicios SET codigo='M10' WHERE id='3b42f198-2c5a-4848-a61f-32cdbb3f2f75';
UPDATE biblioteca_ejercicios SET codigo='M31' WHERE id='d5d4ec78-9d19-4562-a3de-ab895d5009dc';
UPDATE biblioteca_ejercicios SET codigo='C02' WHERE id='f3dc46fc-becb-44cf-a330-e3bace275406';
UPDATE biblioteca_ejercicios SET codigo='C12' WHERE id='691a0f33-065e-44e5-8f34-4be9d0237de3';
UPDATE biblioteca_ejercicios SET codigo='M30' WHERE id='4c97f1d4-1373-4c84-8c67-1af9c8275f1c';
UPDATE biblioteca_ejercicios SET codigo='M32' WHERE id='9c11062f-f23d-4578-abf1-a0a89caa14b7';
UPDATE biblioteca_ejercicios SET codigo='M33' WHERE id='4c035cff-b4c0-4231-8346-9df1ebc70b86';
UPDATE biblioteca_ejercicios SET codigo='M25' WHERE id='52c9fcd8-b6df-463e-82bf-2b11d07130b8';
UPDATE biblioteca_ejercicios SET codigo='P10' WHERE id='702f34c5-dc20-4300-ae5f-b7dc89d0a265';
UPDATE biblioteca_ejercicios SET codigo='M36' WHERE id='951416b2-d7d0-42a2-8803-f62b0d08e131';
UPDATE biblioteca_ejercicios SET codigo='M12' WHERE id='8cdc6d91-62ee-4b69-8229-526a5a7b2eb0';
UPDATE biblioteca_ejercicios SET codigo='M37' WHERE id='7a340059-e917-437f-acdb-dfc5cfd08d5a';
UPDATE biblioteca_ejercicios SET codigo='M24' WHERE id='6c219e10-c520-41fe-8c5f-b2818ee1ce76';
UPDATE biblioteca_ejercicios SET codigo='M21' WHERE id='94d060f8-9680-492e-8bb4-d8d9727f8c08';
UPDATE biblioteca_ejercicios SET codigo='M20' WHERE id='f1af882f-909f-4677-bd6e-253e99c4804d';
UPDATE biblioteca_ejercicios SET codigo='M23' WHERE id='0b63c1d3-894e-462b-9b71-b5ca8492e03a';
UPDATE biblioteca_ejercicios SET codigo='P31' WHERE id='b60c5e55-3899-4aeb-9d64-0a9d895b793d';
UPDATE biblioteca_ejercicios SET codigo='M35' WHERE id='06aa0194-28e6-4d3c-aa86-1589d1ecb4fe';
UPDATE biblioteca_ejercicios SET codigo='P12' WHERE id='62fb8609-d230-4002-b1a7-d48bce1fa542';
UPDATE biblioteca_ejercicios SET codigo='M14' WHERE id='7744ba1c-e739-41ee-998c-b4bf2fd9867b';
UPDATE biblioteca_ejercicios SET codigo='P22' WHERE id='87302105-06f8-422d-a762-b74e7e05bead';
UPDATE biblioteca_ejercicios SET codigo='P23' WHERE id='52b2b7d0-801d-437d-977d-6efcc899568e';
UPDATE biblioteca_ejercicios SET codigo='C03' WHERE id='04fb1576-7d5d-4828-aa7a-9b164056d93c';
UPDATE biblioteca_ejercicios SET codigo='C09' WHERE id='91b94010-0b08-4268-94a9-1642ab7c8de7';
UPDATE biblioteca_ejercicios SET codigo='P17' WHERE id='3cbf89ac-782e-4981-ba51-e3d37aeb1329';
UPDATE biblioteca_ejercicios SET codigo='M06' WHERE id='a5a1d5e6-1552-420e-8308-c7b72dccd657';
UPDATE biblioteca_ejercicios SET codigo='M07' WHERE id='92349dd1-7da1-4b81-9389-34a43823ab62';
UPDATE biblioteca_ejercicios SET codigo='M34' WHERE id='8ac4ca46-6f69-428b-929f-81c3a1c5f88f';
UPDATE biblioteca_ejercicios SET codigo='M26' WHERE id='262989a3-117f-4a3f-b06b-1b163920d8ec';
UPDATE biblioteca_ejercicios SET codigo='C10' WHERE id='237a7fa4-2894-415d-80de-ae56a7441a59';
UPDATE biblioteca_ejercicios SET codigo='P14' WHERE id='bc09e260-56ae-49ff-87ff-36aad1d6f501';
UPDATE biblioteca_ejercicios SET codigo='C14' WHERE id='2e13f700-cbc6-479a-be86-169952b7897d';
UPDATE biblioteca_ejercicios SET codigo='P15' WHERE id='00d6eb95-db53-4874-9221-873a0109941f';
UPDATE biblioteca_ejercicios SET codigo='C05' WHERE id='e67848ee-31a9-4ee6-869e-0ed3e62de21a';
UPDATE biblioteca_ejercicios SET codigo='P09' WHERE id='c9c729a3-e47f-488c-b26c-638e4d360673';
UPDATE biblioteca_ejercicios SET codigo='P05' WHERE id='b896fcdb-3e83-466f-bc4f-e990e17fae41';
UPDATE biblioteca_ejercicios SET codigo='M17' WHERE id='d283c633-85dd-4be5-b10e-4f60198854f6';
UPDATE biblioteca_ejercicios SET codigo='M18' WHERE id='47465671-c0f7-47d7-b826-6ee095ba09e3';
UPDATE biblioteca_ejercicios SET codigo='C08' WHERE id='be62622b-3b23-49e3-ae50-68fd2bc4c543';
UPDATE biblioteca_ejercicios SET codigo='P01' WHERE id='f14d1ecf-6815-4a3e-9eb9-852cebd6e909';
UPDATE biblioteca_ejercicios SET codigo='P19' WHERE id='b07d2d38-810e-4a85-9a03-a8b741d0d655';
UPDATE biblioteca_ejercicios SET codigo='M03' WHERE id='3665d8df-335f-430a-83bb-48900ff227d6';
UPDATE biblioteca_ejercicios SET codigo='P21' WHERE id='27d8d916-9664-4f14-8708-76a847d6415a';
UPDATE biblioteca_ejercicios SET codigo='M22' WHERE id='7c8a88cf-6ebf-4281-9be6-499c5785b47b';
UPDATE biblioteca_ejercicios SET codigo='P16' WHERE id='13f37cf3-42d0-4b29-8550-aea1ee753b53';
-- "Remo a un brazo (banda)" normaliza igual que "Remo a un brazo" (el
-- matcher ignora paréntesis) pero es una variante con elástico, no el mismo
-- ejercicio — se le da un código X propio en vez de pisar P16.
UPDATE biblioteca_ejercicios SET codigo='X43' WHERE id='f18ea6cc-1e81-45a9-a580-0a02e7d841a2';
UPDATE biblioteca_ejercicios SET codigo='E03' WHERE id='3076c966-0c12-424d-90c0-10b276254ad2';
UPDATE biblioteca_ejercicios SET codigo='C04' WHERE id='a049a963-ba10-4367-9371-bda04a2a4e3f';
UPDATE biblioteca_ejercicios SET codigo='C13' WHERE id='76e2f25f-35b0-4490-8843-798cee05fc4d';
UPDATE biblioteca_ejercicios SET codigo='E04' WHERE id='d80973e7-eefb-4db1-81bd-381c3564a07e';
UPDATE biblioteca_ejercicios SET codigo='P20' WHERE id='3dfe2727-d66b-4785-b0a9-e8fe08a98ff4';
UPDATE biblioteca_ejercicios SET codigo='E05' WHERE id='e327f3a7-d718-47de-9ada-06948f790ef7';
UPDATE biblioteca_ejercicios SET codigo='C01' WHERE id='8e89b27c-39a9-4913-897a-339c46b50e02';
UPDATE biblioteca_ejercicios SET codigo='C11' WHERE id='27341c20-493a-4379-b4f2-a58ba4e64d05';
UPDATE biblioteca_ejercicios SET codigo='M11' WHERE id='ea10cb6a-f38b-49c4-a10e-e001637ceb60';
UPDATE biblioteca_ejercicios SET codigo='M28' WHERE id='ce1e6691-90da-48a2-a2bc-1b910f0a5f89';
UPDATE biblioteca_ejercicios SET codigo='M29' WHERE id='02b600db-97e2-49cd-9532-faaf2b85a4c1';
UPDATE biblioteca_ejercicios SET codigo='M27' WHERE id='9eedf1ea-4f80-4810-ad44-4fa223b0e8a0';
UPDATE biblioteca_ejercicios SET codigo='E02' WHERE id='885de450-f199-47bd-8d2d-85afc78b7dbf';
UPDATE biblioteca_ejercicios SET codigo='M16' WHERE id='4d3fb75e-f78b-4551-969a-f5c29669d2ad';
UPDATE biblioteca_ejercicios SET codigo='C06' WHERE id='68b58e25-0c39-42db-ad74-b539349ced21';
UPDATE biblioteca_ejercicios SET codigo='P08' WHERE id='175b72a8-04a5-4ee3-b425-6a495312e434';
UPDATE biblioteca_ejercicios SET codigo='M15' WHERE id='27ba3d86-035e-4ee6-af9b-5b6f381652f4';
UPDATE biblioteca_ejercicios SET codigo='C07' WHERE id='15f84b63-4a94-4b06-8ba4-c53eaf38f330';
UPDATE biblioteca_ejercicios SET codigo='P13' WHERE id='16579082-6b6d-426e-a472-70295a0ef04a';
UPDATE biblioteca_ejercicios SET codigo='X01' WHERE id='d8a69667-55a6-4fbe-b9a4-4d2a4bfe3954';
UPDATE biblioteca_ejercicios SET codigo='X02' WHERE id='fd874bb6-7750-4cf8-b698-06ae1ecadc47';
UPDATE biblioteca_ejercicios SET codigo='X03' WHERE id='ac5bfb99-54ae-4b60-aa7c-8cd3880dd93d';
UPDATE biblioteca_ejercicios SET codigo='X04' WHERE id='049574f3-4f39-471c-bb31-77595562315b';
UPDATE biblioteca_ejercicios SET codigo='X05' WHERE id='53c794a7-29c6-44c7-8519-974b1b4da093';
UPDATE biblioteca_ejercicios SET codigo='X06' WHERE id='f7d9fcf1-303d-4e35-9440-97e354de8e3c';
UPDATE biblioteca_ejercicios SET codigo='X07' WHERE id='0f5ee308-9159-45d3-8b17-e441372508b0';
UPDATE biblioteca_ejercicios SET codigo='X08' WHERE id='a699f6a2-36d8-4c3c-879b-7acaa35bc981';
UPDATE biblioteca_ejercicios SET codigo='X09' WHERE id='dba13ea0-8aaf-4ec2-a9ce-21321311df3d';
UPDATE biblioteca_ejercicios SET codigo='X10' WHERE id='81f18b7d-bd34-4d9a-877a-15f528c92773';
UPDATE biblioteca_ejercicios SET codigo='X11' WHERE id='a2aea592-affc-4a11-9349-fa850fbcc494';
UPDATE biblioteca_ejercicios SET codigo='X12' WHERE id='e223c97b-a044-44a6-a164-f446eabbd462';
UPDATE biblioteca_ejercicios SET codigo='X13' WHERE id='61a9d4a5-11b4-4539-8a43-7a402ca5b727';
UPDATE biblioteca_ejercicios SET codigo='X14' WHERE id='3bb67ab3-3638-42c4-a504-4b76f2514515';
UPDATE biblioteca_ejercicios SET codigo='X15' WHERE id='5bd1bb8e-a188-44eb-9c34-6647d77bbf42';
UPDATE biblioteca_ejercicios SET codigo='X16' WHERE id='6125d7f4-4359-479f-9861-254426fbf463';
UPDATE biblioteca_ejercicios SET codigo='X17' WHERE id='ce51f7c1-40ed-450e-819e-44eb5dbdb9e9';
UPDATE biblioteca_ejercicios SET codigo='X18' WHERE id='63483a1e-ccb5-42fb-a96c-3a7f190c05b8';
UPDATE biblioteca_ejercicios SET codigo='X19' WHERE id='beb4834f-c28c-4dfb-9e4b-5bad4555dafb';
UPDATE biblioteca_ejercicios SET codigo='X20' WHERE id='29ef0abb-5529-4065-8e40-23a3ed06e6e2';
UPDATE biblioteca_ejercicios SET codigo='X21' WHERE id='bafb30df-b4e4-4056-8a02-f12cdbaf4634';
UPDATE biblioteca_ejercicios SET codigo='X22' WHERE id='0008ab3c-dcea-4ed3-8210-d55ffede9e93';
UPDATE biblioteca_ejercicios SET codigo='X23' WHERE id='c1e290c9-8187-4169-91ea-9ef1142361a4';
UPDATE biblioteca_ejercicios SET codigo='X24' WHERE id='7686118c-6b3b-416f-a775-e50199dd54fd';
UPDATE biblioteca_ejercicios SET codigo='X25' WHERE id='75e23356-5aa4-4294-9b01-43c944074330';
UPDATE biblioteca_ejercicios SET codigo='X26' WHERE id='2b976c7b-6817-494c-9424-d3843d7b45c5';
UPDATE biblioteca_ejercicios SET codigo='X27' WHERE id='f0ebe904-6e39-43db-8a7a-301fac005939';
UPDATE biblioteca_ejercicios SET codigo='X28' WHERE id='dc5927f1-f3e4-4fe2-8489-d72e4e4f7e2e';
UPDATE biblioteca_ejercicios SET codigo='X29' WHERE id='b53a0939-ef7c-41e3-8931-cbb5e21b180d';
UPDATE biblioteca_ejercicios SET codigo='X30' WHERE id='d7c11eb4-283c-48bb-9347-8fd282dd45bb';
UPDATE biblioteca_ejercicios SET codigo='X31' WHERE id='5bb40324-298c-408a-a60b-cb558cf7f9a4';
UPDATE biblioteca_ejercicios SET codigo='X32' WHERE id='30ea8d03-0031-4c26-af0c-92310f07f082';
UPDATE biblioteca_ejercicios SET codigo='X33' WHERE id='22eed70e-8c81-4849-8c3a-e018b9b0659a';
UPDATE biblioteca_ejercicios SET codigo='X34' WHERE id='1383f9d7-6205-407c-a69d-8e3db0fb1fc3';
UPDATE biblioteca_ejercicios SET codigo='X35' WHERE id='30393f75-e73f-4074-b4b8-87e13207e532';
UPDATE biblioteca_ejercicios SET codigo='X36' WHERE id='79ccc942-7ad4-4e14-8712-f3b836d3b83b';
UPDATE biblioteca_ejercicios SET codigo='X37' WHERE id='bee35e55-6865-446e-b3e3-b0a7d53bec8d';
UPDATE biblioteca_ejercicios SET codigo='X38' WHERE id='8f34b816-7704-4e31-85f5-2c1515a0f595';
UPDATE biblioteca_ejercicios SET codigo='X39' WHERE id='93c54c16-2124-4502-a6d4-503cf5c2fc51';
UPDATE biblioteca_ejercicios SET codigo='X40' WHERE id='b68e3927-a828-49e2-bba0-66c3cad4ee64';
UPDATE biblioteca_ejercicios SET codigo='X41' WHERE id='2d76bad0-cb46-445f-b4b7-ebd435d65bfb';
UPDATE biblioteca_ejercicios SET codigo='X42' WHERE id='39433c2f-c664-4898-aeb7-b8ad2d77d1ad';

-- Backfill de plan_ejercicios (72 filas ya asignadas a Agustina/Franco/Lucas
-- Verissimo), por nombre exacto — matched contra planTemplates.js o, para
-- 4 nombres de rondas viejas, reusando el código X que ya tenían en
-- biblioteca_ejercicios para el mismo nombre.
UPDATE plan_ejercicios SET codigo='P01' WHERE codigo IS NULL AND nombre='Press de hombros sentado con mancuernas';
UPDATE plan_ejercicios SET codigo='P05' WHERE codigo IS NULL AND nombre='Peso muerto con kettlebell';
UPDATE plan_ejercicios SET codigo='P08' WHERE codigo IS NULL AND nombre='Sentadilla con barra';
UPDATE plan_ejercicios SET codigo='P09' WHERE codigo IS NULL AND nombre='Peso muerto con barra';
UPDATE plan_ejercicios SET codigo='P10' WHERE codigo IS NULL AND nombre='Dominadas';
UPDATE plan_ejercicios SET codigo='P12' WHERE codigo IS NULL AND nombre='Fuerza con impulso a un brazo';
UPDATE plan_ejercicios SET codigo='P13' WHERE codigo IS NULL AND nombre='Zancada a una pierna';
UPDATE plan_ejercicios SET codigo='P14' WHERE codigo IS NULL AND nombre='Pecho inclinado con mancuerna';
UPDATE plan_ejercicios SET codigo='P15' WHERE codigo IS NULL AND nombre='Peso muerto a una pierna';
UPDATE plan_ejercicios SET codigo='P16' WHERE codigo IS NULL AND nombre='Remo a un brazo';
UPDATE plan_ejercicios SET codigo='P17' WHERE codigo IS NULL AND nombre='Levantada de cadera a una pierna';
UPDATE plan_ejercicios SET codigo='P18' WHERE codigo IS NULL AND nombre='Levantada del cajon';
UPDATE plan_ejercicios SET codigo='P19' WHERE codigo IS NULL AND nombre='Press de pecho con barra en banco plano';
UPDATE plan_ejercicios SET codigo='P20' WHERE codigo IS NULL AND nombre='Remo en TRX inclinado';
UPDATE plan_ejercicios SET codigo='P21' WHERE codigo IS NULL AND nombre='Puente de gluteos con peso';
UPDATE plan_ejercicios SET codigo='P23' WHERE codigo IS NULL AND nombre='Hip thrust con barra o mancuerna';
UPDATE plan_ejercicios SET codigo='X17' WHERE codigo IS NULL AND nombre='Fuerza con impulso con barra';
UPDATE plan_ejercicios SET codigo='X18' WHERE codigo IS NULL AND nombre='Hip Thrust bilateral';
UPDATE plan_ejercicios SET codigo='X21' WHERE codigo IS NULL AND nombre='Jalon al pecho / Maquina dorsales';
UPDATE plan_ejercicios SET codigo='X29' WHERE codigo IS NULL AND nombre='Pecho plano con barra';

-- Verificación
SELECT
  substring(codigo from '^[A-Z]+') AS prefijo,
  count(*) AS cantidad
FROM biblioteca_ejercicios
GROUP BY 1
ORDER BY 1;

SELECT count(*) AS sin_codigo FROM biblioteca_ejercicios WHERE codigo IS NULL;

SELECT column_name FROM information_schema.columns
WHERE table_name = 'plan_ejercicios' AND column_name = 'codigo';

SELECT count(*) AS total, count(codigo) AS con_codigo FROM plan_ejercicios;
