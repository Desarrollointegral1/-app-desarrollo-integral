# Códigos del catálogo completo (`catalogo_ejercicios.codigo_di`)

> Fuente única de este mapping. Backfill aplicado en `migrations/020_codigos_catalogo_completo.sql`
> (Supabase `tlxkghpytznkxgqslqzj`, punto 9, 2026-07-21). Los 1.343 ejercicios del catálogo
> tienen código único: **prefijo de 2 letras = `target_es` (músculo objetivo del dataset)**,
> **número de 3 dígitos creciente por dificultad de equipamiento** (peso corporal/asistido →
> banda/polea/tool → mancuerna/kettlebell → barra/máquina compleja), con el nombre como
> desempate alfabético dentro de cada nivel.

## Los ~50 "Principales DI" (sin tocar)

Códigos asignados a mano por Lucas (ronda 13, 2026-07-21) como **patrones de movimiento**,
no 1:1 con músculo — por eso un mismo prefijo puede mezclar más de un `target_es`
(ej. `CA` = peso muerto/bisagra de cadera, cubre tanto Isquiotibiales como Glúteos).
El backfill de este punto **nunca pisa** estos códigos (`WHERE codigo_di IS NULL`).

| Prefijo | Grupo (criterio de Lucas) | Rango original |
|---|---|---|
| PH | Hombro (press) | PH001–PH009 |
| RO | Rodilla (sentadilla) | RO001–RO009 |
| PE | Pecho (empuje horizontal) | PE001–PE005 |
| CA | Cadera (bisagra/peso muerto) | CA001–CA007 |
| JA | Jalón (tracción de espalda) | JA001–JA006 |
| GL | Glúteo (extensión de cadera) | GL001–GL007 |
| CO | Core (anti-rotación/abdomen) | CO001–CO007 |

## Backfill del resto del catálogo (1.293 filas)

Para el resto, sin el criterio curado de movimiento, se usó `target_es` directo del dataset.
Los 7 `target_es` que ya coincidían con un prefijo DI **extendieron la numeración** desde el
máximo existente (para no romper unicidad); los otros 12 arrancaron en 001 con letra nueva.

| Prefijo | `target_es` | Filas backfill | Rango final |
|---|---|---|---|
| PH | Deltoides *(extiende)* | 139 | PH010–PH148 |
| PE | Pectorales *(extiende)* | 153 | PE006–PE158 |
| RO | Cuádriceps *(extiende)* | 42 | RO010–RO051 |
| CA | Isquiotibiales *(extiende)* | 28 | CA008–CA035 |
| JA | Dorsales + Espalda alta *(extiende)* | 78 + 86 | JA007–JA170 |
| GL | Glúteos *(extiende)* | 135 | GL008–GL142 |
| CO | Abdominales *(extiende)* | 163 | CO008–CO170 |
| **BI** *(nuevo)* | Bíceps | 151 | BI001–BI151 |
| **TR** *(nuevo)* | triceps | 141 | TR001–TR141 |
| **PA** *(nuevo)* | Pantorrillas | 59 | PA001–PA059 |
| **AN** *(nuevo)* | Antebrazos | 37 | AN001–AN037 |
| **CD** *(nuevo)* | Sistema cardiovascular (cardio) | 29 | CD001–CD029 |
| **CL** *(nuevo)* | Columna / Espinales | 19 | CL001–CL019 |
| **TZ** *(nuevo)* | Trapecios | 15 | TZ001–TZ015 |
| **AD** *(nuevo)* | Aductores + Abductores (mismo prefijo, agrupados) | 6 + 5 | AD001–AD011 |
| **SE** *(nuevo)* | Serrato anterior | 5 | SE001–SE005 |
| **CU** *(nuevo)* | Elevador de la escápula (único `target_es` de `body_part=neck`, "Cuello") | 2 | CU001–CU002 |

**Total: 1.343 filas, 1.343 códigos únicos** (verificado por SQL — 0 filas sin código, 0 códigos duplicados).

## Criterio de dificultad (equipment_es → nivel)

1. Peso corporal, Asistido
2. Banda, Banda elástica, Polea, Soga, Rodillo, Bosu, Pelota de estabilidad, Rueda abdominal, Pelota medicinal
3. Mancuerna, Kettlebell
4. Barra, Barra Z, Barra olímpica, Barra hexagonal, Máquina de palanca, Máquina Smith, Prensa/Sled, Con peso extra, y equipamiento de cardio (Escalador, Elíptico, Bicicleta fija, Ergómetro de brazos, Máquina SkiErg, Neumático, Martillo)

Regenerable corriendo de nuevo el `WITH ... UPDATE` de la migración 020 si se cargan ejercicios
nuevos al catálogo (el offset por prefijo habría que recalcularlo contra el máximo real en ese momento).
