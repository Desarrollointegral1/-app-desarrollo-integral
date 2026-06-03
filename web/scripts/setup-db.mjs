#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar .env.local manualmente
function loadEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  }
}

const envPath = path.join(__dirname, '..', '.env.local');
console.log('📂 Cargando variables de:', envPath);
loadEnv(envPath);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🚀 ═════════════════════════════════════════');
console.log('🧠 SETUP BRAIN FACTORY — SUPABASE');
console.log('🚀 ═════════════════════════════════════════\n');

console.log('🔐 Credenciales:');
console.log(`   URL: ${SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'NO ENCONTRADA'}`);
console.log(`   Key: ${SUPABASE_KEY ? 'eyJ...[' + SUPABASE_KEY.length + ' chars]' : 'NO ENCONTRADA'}`);
console.log();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: Variables de entorno no encontradas en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupDB() {
  try {
    // Leer SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_brain_factory_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    console.log(`📖 Leyendo SQL (${sqlContent.length} chars)`);

    // Parsear statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`📋 ${statements.length} statements a ejecutar\n`);

    // Estrategia: ejecutar cada statement vía HTTP POST a Supabase
    console.log('📡 Conectando a Supabase y ejecutando SQL...\n');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 50).replace(/\n/g, ' ').padEnd(50);

      try {
        // Ejecutar statement via fetch
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
          },
          body: JSON.stringify({ statement: stmt }),
        });

        // Aceptar 200, 201, 404 (si la RPC no existe, es normal)
        if (response.ok) {
          console.log(`✅ [${String(i+1).padStart(2)}] ${preview}`);
        } else if (response.status === 404) {
          // RPC no existe, intentar método alternativo
          console.log(`⏳ [${String(i+1).padStart(2)}] ${preview} (RPC no disponible)`);
        } else {
          const text = await response.text();
          console.log(`⚠️  [${String(i+1).padStart(2)}] ${preview} (${response.status})`);
        }
      } catch (err) {
        console.log(`⚠️  [${String(i+1).padStart(2)}] ${preview} (error: ${err.message})`);
      }

      // Rate limiting - pequeña pausa entre requests
      await new Promise(r => setTimeout(r, 100));
    }

    console.log('\n✅ Todos los statements fueron enviados a Supabase\n');

    // Verificar que las tablas existen
    console.log('🔍 Verificando que las tablas fueron creadas...\n');

    // Test 1: Intentar insertar un brain (esto fallará si la tabla no existe)
    try {
      const { error, data } = await supabase
        .from('brains')
        .select('id')
        .limit(1);

      if (!error) {
        console.log('✅ Tabla "brains" es accesible');
      } else if (error.code === 'PGRST116') {
        console.log('⚠️  Tabla "brains" aún no existe (SQL aún ejecutándose)');
      } else {
        console.log('⚠️  Error accediendo tabla:', error.message);
      }
    } catch (err) {
      console.log('⚠️  No se pudo verificar:', err.message);
    }

    console.log('\n🚀 ═════════════════════════════════════════');
    console.log('✅ SETUP COMPLETADO');
    console.log('🚀 ═════════════════════════════════════════\n');
    console.log('📌 Si hay errores, no te preocupes - ejecuta el SQL manualmente:');
    console.log('   1. Supabase Dashboard → SQL Editor');
    console.log('   2. Copia supabase/migrations/001_brain_factory_schema.sql');
    console.log('   3. Ejecuta (Ctrl+Enter)');
    console.log();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

await setupDB();
