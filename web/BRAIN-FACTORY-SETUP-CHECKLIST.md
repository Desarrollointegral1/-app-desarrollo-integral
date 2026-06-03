# 🧠 Brain Factory — Setup Checklist

## ✅ Completado Automáticamente

- [x] **Variables de Entorno**
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - ANTHROPIC_API_KEY
  - GITHUB_TOKEN (placeholder - necesita tu token real)
  - Archivo: `.env.local`

- [x] **Brain Factory Code**
  - Schema SQL: `supabase/migrations/001_brain_factory_schema.sql`
  - Core: `lib/brain-factory/core/*.ts`
  - API: `app/api/brains/**/*.ts`
  - Inicialización: `app/layout.tsx`
  - Exports: `lib/brain-factory/index.ts`

- [x] **Servidor iniciado**
  - `npm run dev` corriendo
  - Escuchando en puerto 3000 (o 3004 si hay conflicto)

---

## ⚠️ PASO CRÍTICO — Ejecutar SQL en Supabase (5 min)

**ESTO LO DEBES HACER AHORA MISMO:**

1. Abre Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj
   ```

2. Ve a **SQL Editor** → **New Query**

3. Copia **TODO** el contenido de:
   ```
   supabase/migrations/001_brain_factory_schema.sql
   ```

4. Pega en el editor de Supabase

5. **Ejecuta**: Ctrl+Enter (o el botón ▶️)

6. Deberías ver `✅` sin errores

**Por qué es necesario:**
- Brain Factory necesita 6 tablas en Supabase (brains, brain_documents, brain_queries, etc)
- Sin ellas, cualquier intento de crear un brain fallará
- Solo necesitas hacerlo una vez

---

## 📝 PASO 2 — Reemplazar GITHUB_TOKEN

El token actual es un placeholder. Necesitas tu token real:

1. Ve a GitHub Settings → Developer Settings → Personal Access Tokens
2. Crea un **Fine-grained token** o **Classic token** con:
   - ✅ `repo` scope
   - ✅ `read:user` scope
3. Copia el token
4. Edita `.env.local` y reemplaza:
   ```env
   GITHUB_TOKEN=ghp_xxxx... → GITHUB_TOKEN=ghp_[tu token aquí]
   ```

**Por qué:**
- Necesario solo si usarás GitHub Sync (auto-actualizar brains desde GitHub)
- Si no lo haces, los brains no se sincronizarán automáticamente
- Puedes saltarlo si creas brains solo manualmente

---

## 🧠 PASO 3 — Crear tu Primer Brain

Una vez Supabase esté listo, usa Charles:

```
/charles crea un brain de nutrición
```

**Respuesta esperada:**
```
✅ Brain de Nutrición creado
   ID: [uuid]
   Dominio: nutrition
   Status: READY
```

---

## ✅ PASO 4 — Alimentar el Brain

Agrega contenido:

```
/charles agrega al brain de nutrición:
"# Proteína para Ganancia Muscular
Recomendación: 1.6-2.2g por kg de peso corporal.
Fuentes: pollo, huevos, pescado, legumbres, productos lácteos."
```

---

## 💬 PASO 5 — Hacer tu Primera Pregunta

```
/charles pregunta al brain de nutrición: ¿cuánta proteína necesito para ganar músculo?
```

**Respuesta esperada:**
```
🧠 Brain de Nutrición respondió:

Para ganar músculo, necesitas consumir aproximadamente 1.6 a 2.2 gramos de proteína 
por kilogramo de peso corporal al día...

[respuesta completa generada por Claude]
```

---

## 🚀 Estado Actual

- ✅ Servidor Next.js: CORRIENDO
- ⏳ Supabase Schema: ESPERANDO (necesitas ejecutar SQL)
- ⏳ GitHub Sync: ESPERANDO (después de completar steps 1-2)
- ⏳ Primer Brain: LISTO (después de completar step 1)

---

## 🔗 Recursos

| Recurso | URL |
|---------|-----|
| Supabase Dashboard | https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj |
| SQL Editor | https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql |
| GitHub Tokens | https://github.com/settings/personal-access-tokens |
| Brain Factory Docs | ./BRAIN-FACTORY-COMPLETE.md |

---

**⏱️ Tiempo Total: ~15 minutos**

1. Ejecutar SQL: 5 min
2. GitHub Token: 3 min
3. Crear brains + probar: 7 min

¡Listo! 🚀
