#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
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

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🧠 ═════════════════════════════════════════');
console.log('  BRAIN FACTORY — VERIFICACIÓN');
console.log('🧠 ═════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDB() {
  try {
    // Intentar acceder a la tabla brains
    const { data, error } = await supabase
      .from('brains')
      .select('id')
      .limit(1);

    if (!error || (error && error.message.includes('JSON'))) {
      console.log('✅ Base de datos LISTA');
      console.log('   Tabla "brains" es accesible\n');
      console.log('🚀 ¡Brain Factory está listo para usar!\n');
      console.log('   Comandos disponibles:');
      console.log('   • /charles crea un brain de nutrición');
      console.log('   • /charles agrega al brain de nutrición: [contenido]');
      console.log('   • /charles pregunta al brain de nutrición: [pregunta]\n');
      return true;
    } else {
      console.log('⚠️  Base de datos NO lista\n');
      console.log('Error:', error.message);
      return false;
    }

  } catch (err) {
    console.log('⚠️  No se pudo conectar a Supabase\n');
    console.log('Error:', err.message);
    return false;
  }
}

async function main() {
  const dbReady = await checkDB();

  if (!dbReady) {
    console.log('\n📌 SOLUCIÓN: Ejecuta el SQL en Supabase\n');
    console.log('1. Abre: https://supabase.com/dashboard/project/tlxkghpytznkxgqslqzj/sql');
    console.log('2. Copia todo el contenido de: supabase/migrations/001_brain_factory_schema.sql');
    console.log('3. Pega en Supabase SQL Editor');
    console.log('4. Ejecuta (Ctrl+Enter)');
    console.log('5. Vuelve aquí y ejecuta este script de nuevo\n');
  }
}

main().catch(console.error);
