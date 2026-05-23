#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando proceso de migraciones...\n');

// Instalamos pg package si no existe
console.log('📦 Verificando dependencias...');

const packageJsonPath = path.join(__dirname, 'package.json');
let packageJson = { dependencies: {} };

if (fs.existsSync(packageJsonPath)) {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

if (!packageJson.dependencies.pg) {
  console.log('📥 Instalando pg...');
  exec('npm install pg', (error, stdout, stderr) => {
    if (error) {
      console.error('Error installing pg:', error);
      runMigrations();
    } else {
      console.log('✅ pg instalado\n');
      runMigrations();
    }
  });
} else {
  runMigrations();
}

function runMigrations() {
  try {
    const { Client } = require('pg');

    // Configuración de Supabase
    const client = new Client({
      host: 'tlxkghpytznkxgqslqzj.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: process.env.SUPABASE_DB_PASSWORD || '', // Debe estar en variable de entorno
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Leer migraciones
    const migrationPath = path.join(__dirname, 'migrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('⚠️  ATENCIÓN: Necesito la contraseña de la base de datos de Supabase\n');
    console.log('Opción 1: Establecer variable de entorno');
    console.log('  Windows (PowerShell): $env:SUPABASE_DB_PASSWORD = "tu-contraseña"');
    console.log('  Windows (CMD): set SUPABASE_DB_PASSWORD=tu-contraseña');
    console.log('  Linux/Mac: export SUPABASE_DB_PASSWORD=tu-contraseña\n');

    console.log('Opción 2: Ejecutar con contraseña inline');
    console.log('  SUPABASE_DB_PASSWORD="tu-contraseña" node run-migrations.js\n');

    console.log('Para obtener la contraseña:');
    console.log('  1. Abre: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj');
    console.log('  2. Click en: Project Settings');
    console.log('  3. Click en: Database');
    console.log('  4. Busca: "Password" o "DB Password"\n');

    if (!process.env.SUPABASE_DB_PASSWORD) {
      console.log('❌ SUPABASE_DB_PASSWORD no está definida.\n');
      console.log('Sin ella, no puedo conectarme a la base de datos.\n');

      // Mostrar alternativa
      showManualInstructions();
      process.exit(1);
    }

    console.log('🔌 Conectando a Supabase...');

    client.connect((err) => {
      if (err) {
        console.error('❌ Error de conexión:', err.message);
        showManualInstructions();
        process.exit(1);
      }

      console.log('✅ Conectado a Supabase\n');
      console.log('⏳ Ejecutando migraciones...\n');

      client.query(migrationSQL, (err, res) => {
        if (err) {
          console.error('❌ Error ejecutando migraciones:');
          console.error(err.message);
          client.end();
          process.exit(1);
        }

        console.log('✅ Migraciones ejecutadas correctamente!\n');
        console.log('📊 Resumen:');
        console.log('  ✓ Tabla entrenamientos creada');
        console.log('  ✓ Tabla registros_diarios creada');
        console.log('  ✓ Tabla bioimpedancia extendida');
        console.log('  ✓ Tabla reporte_mensual_cache creada');
        console.log('  ✓ Columnas agregadas a tabla alumnos\n');

        client.end();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    showManualInstructions();
    process.exit(1);
  }
}

function showManualInstructions() {
  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log('ALTERNATIVA: Ejecutar migraciones manualmente en Supabase');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  console.log('1. Abre: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj');
  console.log('2. Click en: SQL Editor (izquierda)');
  console.log('3. Click en: Create a new query');
  console.log('4. Abre: migrations.sql en este directorio');
  console.log('5. Copia TODO el contenido del archivo');
  console.log('6. Pega en el editor SQL de Supabase');
  console.log('7. Click en: Run\n');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}
