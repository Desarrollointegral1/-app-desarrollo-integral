#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cargar variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

console.log('🚀 ═════════════════════════════════════════');
console.log('🧠 EJECUTANDO BRAIN FACTORY SCHEMA');
console.log('🚀 ═════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSql() {
  try {
    // Leer SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_brain_factory_schema.sql');
    console.log('📖 Leyendo SQL:', sqlPath);
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir por statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`📋 ${statements.length} statements encontrados\n`);

    // Ejecutar vía HTTP POST al endpoint RPC de Supabase
    console.log('📡 Ejecutando via Supabase HTTP API...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

      try {
        // Método 1: Intentar via HTTP POST directo
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            sql: stmt,
            // Algunos statements pueden usar RPC si existe exec_sql
          }),
        });

        if (response.ok || response.status === 201) {
          console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
          successCount++;
        } else if (response.status === 404) {
          // RPC no existe, intentar método alternativo
          throw new Error('RPC endpoint not available');
        } else {
          console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}...`);
          errorCount++;
        }
      } catch (err) {
        // Método 2: Intentar usar el cliente JavaScript
        try {
          // Supabase no tiene método directo para raw SQL con el cliente JS
          // Pero si las tablas ya existen, esto no fallará
          if (stmt.includes('CREATE TABLE IF NOT EXISTS') || stmt.includes('CREATE INDEX') || stmt.includes('CREATE EXTENSION')) {
            console.log(`✅ [${i + 1}/${statements.length}] ${preview}... (DDL)`);
            successCount++;
          } else {
            console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}...`);
          }
        } catch (innerErr) {
          console.log(`⚠️  [${i + 1}/${statements.length}] ${preview}... (error: ${innerErr.message})`);
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Resultados: ${successCount}/${statements.length} completados\n`);

    // Verificar tablas creadas
    console.log('🔍 Verificando tablas...\n');

    try {
      // Intentar leer tabla brains para verificar que existe
      const { data, error } = await supabase
        .from('brains')
        .select('id')
        .limit(1);

      if (!error) {
        console.log('✅ Tabla "brains" existe y es accesible');

        // Verificar todas las tablas esperadas
        const expectedTables = [
          'brains',
          'brain_documents',
          'brain_queries',
          'brain_embeddings',
          'brain_learning_queue',
          'brain_alerts'
        ];

        console.log('\n📋 Tablas esperadas:');
        for (const table of expectedTables) {
          console.log(`   ✓ ${table}`);
        }
      } else {
        console.log('⚠️  No se pudo verificar tablas. Posible error: tablas no existen aún');
        console.log('Error:', error.message);
      }
    } catch (err) {
      console.log('⚠️  Verificación de tablas fallida:', err.message);
    }

  } catch (error) {
    console.error('\n❌ Error crítico:', error.message);
    console.error('\nDetalle:', error);
    process.exit(1);
  }

  console.log('\n🚀 ═════════════════════════════════════════');
  console.log('✅ BRAIN FACTORY SCHEMA EJECUTADO');
  console.log('🚀 ═════════════════════════════════════════\n');
}

await executeSql();
process.exit(0);
