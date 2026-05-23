#!/usr/bin/env node

/**
 * SETUP DE MIGRACIONES - App Desarrollo Integral v2
 *
 * Este script ejecuta TODAS las migraciones SQL automáticamente.
 * Solo necesita: contraseña de la base de datos de Supabase
 *
 * Uso: node setup-migrations.js
 * O:   npm run setup-migrations
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`
${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════${colors.reset}
${colors.cyan}${colors.bright}  CONFIGURAR MIGRACIONES - App Desarrollo Integral v2${colors.reset}
${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════${colors.reset}
`);

// Solicitar contraseña
rl.question(
  `${colors.bright}🔐 Contraseña de Base de Datos Supabase:${colors.reset} `,
  async (password) => {
    rl.close();

    if (!password) {
      console.log(`${colors.red}❌ Contraseña requerida${colors.reset}`);
      process.exit(1);
    }

    try {
      console.log(`\n${colors.yellow}⏳ Conectando a Supabase...${colors.reset}`);

      const client = new Client({
        host: 'tlxkghpytznkxgqslqzj.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: password,
        ssl: {
          rejectUnauthorized: false
        }
      });

      await client.connect();
      console.log(`${colors.green}✓ Conectado${colors.reset}`);

      console.log(`${colors.yellow}⏳ Leyendo migraciones...${colors.reset}`);
      const migrationPath = path.join(__dirname, 'migrations.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
      console.log(`${colors.green}✓ Archivo de migraciones cargado${colors.reset}`);

      console.log(`${colors.yellow}⏳ Ejecutando SQL...${colors.reset}`);
      await client.query(migrationSQL);
      console.log(`${colors.green}✓ SQL ejecutado${colors.reset}`);

      // Verificar tablas creadas
      console.log(`\n${colors.yellow}⏳ Verificando tablas creadas...${colors.reset}`);

      const tables = [
        'entrenamientos',
        'registros_diarios',
        'bioimpedancia',
        'reporte_mensual_cache'
      ];

      for (const table of tables) {
        const result = await client.query(
          `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='${table}');`
        );
        const exists = result.rows[0].exists;
        const status = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`  ${status} Tabla '${table}'`);
      }

      // Verificar columnas en alumnos
      console.log(`\n${colors.yellow}⏳ Verificando columnas en tabla 'alumnos'...${colors.reset}`);

      const columns = ['plan_type', 'fecha_asignacion_plan'];
      for (const col of columns) {
        const result = await client.query(
          `SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='alumnos' AND column_name='${col}');`
        );
        const exists = result.rows[0].exists;
        const status = exists ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`  ${status} Columna '${col}'`);
      }

      await client.end();

      console.log(`
${colors.green}${colors.bright}═══════════════════════════════════════════════════════${colors.reset}
${colors.green}${colors.bright}  ✅ MIGRACIONES COMPLETADAS EXITOSAMENTE${colors.reset}
${colors.green}${colors.bright}═══════════════════════════════════════════════════════${colors.reset}

${colors.bright}Próximos pasos:${colors.reset}
1. Verifica el deployment en Vercel:
   https://vercel.com/desarrollointegral1s-projects/app-desarrollo-integral

2. Una vez que veas "Ready", prueba la app en:
   https://app-desarrollo-integral.vercel.app

3. Prueba estas funcionalidades:

   ${colors.cyan}COMO ADMIN:${colors.reset}
   • Asignar plan bilateral/unilateral a un alumno
   • Ver pestaña "Reportes" con mes selector

   ${colors.cyan}COMO ALUMNO:${colors.reset}
   • Tab "Ejercicios": cargar pesos
   • Tab "Asistencia": marcar presencia
   • Tab "Bioimpedancia": llenar formulario
   • Tab "Pesos": ver histórico

${colors.yellow}⚠️  Si algo falla, revisa la sección de troubleshooting en README_DEPLOYMENT.md${colors.reset}
`);

      process.exit(0);

    } catch (error) {
      console.log(`
${colors.red}${colors.bright}❌ ERROR${colors.reset}
${colors.red}${error.message}${colors.reset}
`);

      if (error.message.includes('password')) {
        console.log(`${colors.yellow}💡 Posibles soluciones:${colors.reset}
1. Verifica que la contraseña sea correcta
2. La contraseña debe ser la del usuario "postgres" en Supabase
3. Para obtenerla:
   - Ve a: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj
   - Click en: Project Settings → Database
   - Busca: "Password" o "DB Password"
`);
      }

      console.log(`
${colors.yellow}${colors.bright}ALTERNATIVA: Ejecutar manualmente en Supabase SQL Editor${colors.reset}
1. Ve a: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql
2. Click en: "Create a new query"
3. Abre el archivo: migrations.sql
4. Copia TODO el contenido
5. Pega en el editor SQL de Supabase
6. Click en: "Run"
`);

      process.exit(1);
    }
  }
);
