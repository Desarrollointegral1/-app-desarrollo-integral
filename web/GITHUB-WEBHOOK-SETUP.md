# 🪝 GitHub Webhook Setup — Brain Factory + Obsidian Sync

El webhook está **listo en el código**. Ahora necesitas configurarlo en GitHub.

---

## ✅ PASO 1: Ir a GitHub Webhooks

1. Abre tu repositorio de Obsidian en GitHub
2. Ve a **Settings** → **Webhooks** (en el menú lateral izquierdo)
3. Haz clic en **Add webhook**

---

## ✅ PASO 2: Configurar el Webhook

Llena estos campos:

### **Payload URL**
```
http://localhost:3000/api/webhooks/github-obsidian
```

> **Si estás en PRODUCCIÓN:**
> Reemplaza `localhost:3000` con tu URL de producción (ej: `https://tu-dominio.com`)

### **Content type**
Selecciona: **application/json**

### **Secret**
Copia y pega esto:
```
88705021ec3d3ee0cb136efdb329d352fa7f2cee77b794b5bc964a40025a8c59
```

> Este es el `GITHUB_WEBHOOK_SECRET` que ya configuré en `.env.local`

### **Which events would you like to trigger this webhook?**
Selecciona:
- ✅ **Push events** (solo esto)
- ❌ Desactiva todo lo demás

### **Active**
Asegúrate de que la casilla esté ✅ **marcada**

### Haz clic en **Add webhook**

---

## ✅ PASO 3: Crear Estructura de Carpetas en Obsidian

En tu vault de Obsidian, crea esta estructura de carpetas:

```
tu-vault/
├── obsidian/
│   ├── nutricion/          
│   │   └── (aquí van tus notas de nutrición)
│   ├── entrenamiento/      
│   │   └── (aquí van tus notas de entrenamiento)
│   ├── fisioterapia/       
│   │   └── (aquí van tus notas de fisioterapia)
│   └── desarrollo/         
│       └── (aquí van tus notas de desarrollo integral)
└── otros-archivos/         (ignorados por el webhook)
```

**Nota:** Las carpetas EXACTAS son:
- `obsidian/nutricion/` → mapea al brain de **nutrition**
- `obsidian/entrenamiento/` → mapea al brain de **training**
- `obsidian/fisioterapia/` → mapea al brain de **physiotherapy**
- `obsidian/desarrollo/` → mapea al brain de **development**

---

## ✅ PASO 4: Conectar Obsidian con GitHub

Si usas [Obsidian Git](https://github.com/denolehov/obsidian-git):

1. En Obsidian → **Settings** → **Obsidian Git** → **Auto backup**
2. Configura que haga push cada X minutos (recomendado: 30 minutos)

**O si lo haces manual:**
```bash
cd tu-vault
git add .
git commit -m "Brain Factory sync: nutrición actualizada"
git push origin main
```

---

## ✅ PASO 5: Probar el Webhook

### Opción A: Test automático de GitHub

1. En GitHub, ve a **Settings** → **Webhooks** → tu webhook
2. Desplázate abajo hasta **Recent Deliveries**
3. Busca el último evento
4. Si dice ✅ **202** o **200** → ¡funciona!
5. Si dice ❌ **401** → problema con el secret
6. Si dice ❌ **404** → URL incorrecta

### Opción B: Test manual

1. Crea un archivo en `obsidian/nutricion/test.md`:
   ```markdown
   # Test Nutrición
   
   Este es un documento de prueba.
   ```

2. Sube a GitHub:
   ```bash
   git add obsidian/nutricion/test.md
   git commit -m "test webhook"
   git push origin main
   ```

3. Espera 30 segundos

4. Verifica que se sincronizó:
   ```bash
   curl http://localhost:3000/api/brains \
     -H "Content-Type: application/json"
   ```

   Deberías ver en la respuesta un documento con:
   - `source: "github"`
   - `title: "test"`
   - `domain: "nutrition"` (porque está en `obsidian/nutricion/`)

---

## ⚠️ Troubleshooting

| Problema | Solución |
|----------|----------|
| **404 Not Found** | URL incorrecta en el webhook. Verifica `http://localhost:3000/api/webhooks/github-obsidian` |
| **401 Unauthorized** | Secret incorrecto. Copia exactamente: `88705021ec3d3ee0cb136efdb329d352fa7f2cee77b794b5bc964a40025a8c59` |
| **Documento no aparece** | Verifica que esté en una de las carpetas correctas: `obsidian/nutricion/`, `obsidian/entrenamiento/`, etc |
| **Solo archivos .md** | El webhook solo procesa archivos Markdown (`.md`). Otros formatos son ignorados |
| **Solo main/master** | El webhook solo procesa pushes a `main` o `master`. Otras ramas son ignoradas |

---

## 📊 Cómo funciona

```
Tu edición en Obsidian
    ↓
Git push a GitHub
    ↓
GitHub envía webhook POST a localhost:3000/api/webhooks/github-obsidian
    ↓
Verificación de firma HMAC-SHA256 (usando GITHUB_WEBHOOK_SECRET)
    ↓
Detección de dominio por carpeta (obsidian/nutricion/ → nutrition)
    ↓
Obtención de contenido desde GitHub raw URL
    ↓
Inserción en Supabase table: brain_documents
    ↓
Brain actualizado automáticamente ✅
```

**Latencia:** ~30 segundos a 2 minutos (depende de cuándo hagas push)

---

## 🧠 Próximos pasos

Una vez que todo funcione:

1. **Crear un brain**: `/charles crea un brain de nutrición`
2. **Agregar documentos al brain**: Solo push a `obsidian/nutricion/` en GitHub
3. **Consultar el brain**: `/charles pregunta al brain de nutrición: ¿cuánta proteína?`

El webhook se encargará de mantener todo sincronizado automáticamente.

---

**Status**: ✅ Webhook listo  
**Secret configurado**: ✅ Sí  
**Verificación de firma**: ✅ Habilitada  
**Solo falta**: Configurar en GitHub (pasos 1-2 arriba)
