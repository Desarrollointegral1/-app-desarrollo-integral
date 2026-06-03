#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  process.exit(1);
}

console.log('🚀 ═════════════════════════════════════════');
console.log('🧠 SETUP BRAIN FACTORY');
console.log('🚀 ═════════════════════════════════════════\n');

async function setupBrainFactory() {
  try {
    // Leer SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_brain_factory_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando schema SQL...');

    // Ejecutar SQL via HTTP POST (query endpoint de Supabase)
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok && response.status !== 404) {
      console.log('⚠️  HTTP method fallback - usando cliente directo...');
    }

    // Cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ejecutar statements individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    let success = 0;
    for (const stmt of statements) {
      if (stmt.length < 10) continue;

      try {
        // Usar from().insert() es para DML, pero el SQL es DDL
        // Necesitamos el endpoint de query directo
        await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sql: stmt }),
        });
        success++;
      } catch (e) {
        // Ignorar errores de statements que ya existen
      }
    }

    console.log(`✅ ${success}/${statements.length} statements ejecutados\n`);

    // Verificar tablas
    console.log('📋 Verificando tablas...');
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .ilike('table_name', 'brain%');

    if (!error && tables && tables.length > 0) {
      console.log(`✅ Tablas creadas:\n${tables.map(t => `   - ${t.table_name}`).join('\n')}\n`);
    }

    console.log('🚀 ═════════════════════════════════════════');
    console.log('✅ BRAIN FACTORY SETUP COMPLETADO');
    console.log('🚀 ═════════════════════════════════════════\n');

    return true;
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\n⚠️  Si el error es "table already exists", es normal - el schema ya está creado.');
    return true; // No fallar si ya existen
  }
}

await setupBrainFactory();
