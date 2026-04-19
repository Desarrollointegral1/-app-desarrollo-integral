# Desarrollo Integral - App de Entrenamiento

App completa para gestión de planes de entrenamiento personalizados con autenticación segura, upload de videos y tracking de progreso.

## 📋 Estructura del Proyecto

```
.
├── App.jsx              # App principal React + Vite
├── index.html           
├── package.json
├── vite.config.js
├── services/            # Funciones Supabase
│   └── supabase.js
├── src/utils/           # Utilidades
│   ├── helpers.js
│   ├── pdfGenerator.js
│   └── theme.js
├── web/                 # Landing page Next.js
│   ├── app/
│   │   ├── page.tsx     # Home
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   └── package.json
└── logos/               # Recursos visuales
```

## 🚀 Instalación Local

### App (React + Vite)
```bash
npm install
npm run dev        # http://localhost:5173
npm run build
```

### Landing (Next.js)
```bash
cd web
npm install
npm run dev        # http://localhost:3000
npm run build
```

## 🔐 Autenticación

### Estudiantes
- **Código**: Ej. `DI-001`
- **PIN**: 4 dígitos (ej. `1234`)
- Los códigos se crean en AdminPanel

### Administradores
- **Código Admin**: Ej. `ADMIN-001`
- **PIN Admin**: 4 dígitos
- Se crean directamente en Supabase tabla `admins`

## 📝 Variables de Entorno

Copia `.env.example` a `.env.local` y completa:

```
VITE_SUPABASE_URL=https://tlxkghpytznkxgqslqzj.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 🎥 Features

✅ Login con código + PIN (SHA-256 hasheado)  
✅ Panel admin para crear estudiantes y planes  
✅ Upload de videos a Supabase Storage  
✅ Asignación de planes (bilateral/unilateral)  
✅ Seguimiento de peso e historial  
✅ PDF export de reportes  
✅ Landing page responsive  

## 🔄 Flujo de Uso

1. **Admin**: Crear estudiante con código + PIN
2. **Admin**: Asignar plan (bilateral o unilateral)
3. **Estudiante**: Login con código + PIN
4. **Estudiante**: Ver su plan y ejercicios
5. **Estudiante**: Registrar peso y progreso
6. **Admin**: Ver historial y datos

## 📦 Despliegue

### Vercel

1. Conectar GitHub a Vercel
2. Importar repositorio
3. Configurar variables de entorno en Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

**URLs:**
- App: `https://app-desarrollo-integral.vercel.app`
- Landing: `https://desarrollo-integral-landing.vercel.app`

### Supabase - CORS

Agregar dominio de Vercel en Supabase:
- Settings → API → CORS
- `https://app-desarrollo-integral.vercel.app`

## 🧪 Testing

Credenciales de prueba:
```
Código: DI-TEST-001
PIN: 1234

Admin Código: ADMIN-TEST
Admin PIN: 5678
```

## 📞 Soporte

- Docs Supabase: https://supabase.com/docs
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs

---

**Desarrollado con React, Next.js, Supabase y Tailwind CSS**
