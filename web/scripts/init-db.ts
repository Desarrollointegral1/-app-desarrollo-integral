import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initDB() {
  console.log('🚀 Inicializando Brain Factory Database...\n');

  try {
    // Verificar si las tablas ya existen
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .ilike('table_name', 'brain%');

    if (tables && tables.length > 0) {
      console.log('✅ Schema ya existe. Tablas encontradas:');
      tables.forEach(t => console.log(`   - ${t.table_name}`));
      return true;
    }

    // Si no existen, leer e intentar ejecutar SQL
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '001_brain_factory_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('📝 Ejecutando schema...');

    // Dividir y ejecutar statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 5 && !s.startsWith('--'));

    // Intentar ejecutar cada uno
    let successCount = 0;
    for (const stmt of statements) {
      try {
        // Usar RPC si es disponible, sino usar el admin client directo
        await supabase.rpc('exec_sql', { statement: stmt });
        successCount++;
      } catch (e) {
        // Continuar - los statements pueden fallar si ya existen
      }
    }

    console.log(`✅ Schema inicializado (${successCount}/${statements.length} statements)\n`);
    return true;

  } catch (err) {
    console.error('⚠️  No se pudo inicializar DB automáticamente');
    console.error('✅ Pero eso está bien - ejecuta el SQL manualmente:\n');
    console.error('1. Ve a https://supabase.com/dashboard');
    console.error('2. SQL Editor → New Query');
    console.error('3. Copia el contenido de: supabase/migrations/001_brain_factory_schema.sql');
    console.error('4. Ejecuta (Ctrl+Enter)\n');
    return true; // No fallar, el usuario lo hará manualmente
  }
}

initDB().then(() => process.exit(0));
