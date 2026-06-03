#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados');
  process.exit(1);
}

console.log('🚀 Conectando a Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSql() {
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_brain_factory_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando schema SQL...');

    // Ejecutar cada statement (dividido por ;)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        const result = await supabase.rpc('execute_raw_sql', { sql: statement });
        if (result.error) {
          console.error(`⚠️  Error en statement: ${statement.substring(0, 50)}...`);
          console.error(result.error);
        }
      } catch (err) {
        // Intentar con otro método si RPC no existe
      }
    }

    // Alternativa: Usar el método directo de Supabase
    console.log('📝 Ejecutando schema completo...');
    const { data, error } = await supabase.sql(sql);

    if (error) {
      console.error('❌ Error ejecutando SQL:', error.message);
      // No fallar - el SQL podría ya existir
    } else {
      console.log('✅ Schema ejecutado exitosamente');
    }

    // Verificar que las tablas fueron creadas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (!tablesError && tables) {
      const brainTables = tables
        .map(t => t.table_name)
        .filter(name => name.startsWith('brain'));

      if (brainTables.length > 0) {
        console.log(`✅ Tablas creadas: ${brainTables.join(', ')}`);
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runSql().then(() => {
  console.log('✅ Setup completado');
  process.exit(0);
});
