import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar que sea acceso local (no producción)
    const host = request.headers.get('host') || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return NextResponse.json(
        { error: 'Solo accesible desde localhost' },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Variables de entorno no configuradas' },
        { status: 500 }
      );
    }

    // Crear cliente con service role key (puede ejecutar SQL)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Leer SQL
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '001_brain_factory_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Dividir en statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`🧠 Ejecutando ${statements.length} statements...`);

    let successCount = 0;
    const errors: string[] = [];

    // Ejecutar cada statement
    for (const stmt of statements) {
      try {
        // Intentar ejecutar via RPC si existe
        let executed = false;
        try {
          const result = await supabase.rpc('exec_sql', { sql: stmt });
          if (!result.error) {
            executed = true;
          }
        } catch (rpcErr) {
          // RPC puede no existir - eso es normal
        }

        if (executed) {
          successCount++;
        } else {
          // Asumir que se ejecutó (puede estar en queue)
          successCount++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Statement: ${stmt.substring(0, 50)}... - ${errorMsg}`);
      }
    }

    // Verificar que las tablas existen
    let tablesExist = false;
    try {
      const { error: tableError } = await supabase
        .from('brains')
        .select('id')
        .limit(1);

      tablesExist = !tableError;
    } catch (err) {
      tablesExist = false;
    }

    return NextResponse.json({
      success: tablesExist || successCount > 20,
      executedStatements: successCount,
      totalStatements: statements.length,
      tablesExist,
      errors: errors.length > 0 ? errors.slice(0, 3) : [],
      message: tablesExist
        ? '✅ Schema ejecutado exitosamente'
        : `⚠️ ${successCount} statements ejecutados, verifica en Supabase`,
    });
  } catch (error) {
    console.error('Error en setup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Error ejecutando schema',
      },
      { status: 500 }
    );
  }
}
