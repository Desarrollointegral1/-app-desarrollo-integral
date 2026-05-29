/**
 * ============================================================
 * ADMIN ENDPOINT: Seed Baseline Patterns
 * POST /api/admin/seed-baseline
 * ============================================================
 *
 * Inserta datos baseline en learning_patterns para que el
 * sistema de aprendizaje funcione desde el inicio.
 *
 * Solo ejecutable localmente (no autenticada en desarrollo).
 * En producción, requerir autenticación real.
 *
 * Uso: curl -X POST http://localhost:3000/api/admin/seed-baseline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BASELINE_PATTERNS = [
  {
    task_type: 'diseño',
    keywords: ['diseño', 'ui', 'navbar', 'hero', 'visual'],
    agents_used: ['agent-design-specialist'],
    score: 92,
    time_minutes: 8,
    learning: 'Design Specialist solo lidera tareas visuales simples',
    was_successful: true,
  },
  {
    task_type: 'diseño_mixto',
    keywords: ['rediseña', 'premium', 'landing', 'componente'],
    agents_used: ['agent-design-specialist', 'agent-code-specialist'],
    score: 88,
    time_minutes: 15,
    learning: 'Design + Code juntos para rediseños con implementación',
    was_successful: true,
  },
  {
    task_type: 'performance',
    keywords: ['rápido', 'fcp', 'lighthouse', 'optimiza', 'velocidad'],
    agents_used: ['agent-performance-specialist', 'agent-code-specialist', 'agent-analytics-specialist'],
    score: 90,
    time_minutes: 12,
    learning: 'Performance mejora con Code + Analytics para medición',
    was_successful: true,
  },
  {
    task_type: 'seguridad',
    keywords: ['seguridad', 'auth', 'headers', 'vulnerabilidades', 'compliance'],
    agents_used: ['agent-security-specialist', 'agent-code-specialist'],
    score: 96,
    time_minutes: 10,
    learning: 'Security Specialist + Code Specialist = máxima confianza',
    was_successful: true,
  },
  {
    task_type: 'código',
    keywords: ['implementa', 'código', 'componente', 'refactoriza', 'api'],
    agents_used: ['agent-code-specialist'],
    score: 95,
    time_minutes: 10,
    learning: 'Code Specialist solo para implementaciones limpias',
    was_successful: true,
  },
  {
    task_type: 'contenido',
    keywords: ['copy', 'texto', 'cta', 'mensaje', 'seo'],
    agents_used: ['agent-content-specialist', 'agent-research-specialist'],
    score: 88,
    time_minutes: 7,
    learning: 'Content + Research para copy con datos de respaldo',
    was_successful: true,
  },
  {
    task_type: 'investigación',
    keywords: ['investiga', 'análiza', 'competencia', 'benchmark', 'mercado'],
    agents_used: ['agent-research-specialist', 'agent-analytics-specialist'],
    score: 87,
    time_minutes: 15,
    learning: 'Research + Analytics para análisis profundo',
    was_successful: true,
  },
  {
    task_type: 'media',
    keywords: ['video', 'imagen', 'media', 'asset', 'animación'],
    agents_used: ['agent-media-specialist', 'agent-design-specialist'],
    score: 85,
    time_minutes: 12,
    learning: 'Media + Design para assets optimizados',
    was_successful: true,
  },
  {
    task_type: 'auditoría',
    keywords: ['auditoría', 'completa', 'revisar', 'analizar', 'mejora'],
    agents_used: [
      'agent-security-specialist',
      'agent-code-specialist',
      'agent-performance-specialist',
      'agent-analytics-specialist',
      'agent-research-specialist',
    ],
    score: 82,
    time_minutes: 20,
    learning: 'Auditoría con 5+ agentes da visión 360° del sistema',
    was_successful: true,
  },
  {
    task_type: 'mejora_general',
    keywords: ['mejora', 'optimiza', 'actualiza', 'moderniza'],
    agents_used: ['agent-design-specialist', 'agent-performance-specialist', 'agent-code-specialist'],
    score: 85,
    time_minutes: 18,
    learning: 'Mejoras requieren mínimo 3 agentes para perspectivas múltiples',
    was_successful: true,
  },
];

export async function POST(request: NextRequest) {
  try {
    // Verificar que es ambiente de desarrollo (por seguridad)
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Seed endpoint no disponible en producción' },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase no configurado — faltan NEXT_PUBLIC_SUPABASE_URL o claves' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    // Insertar patrones baseline
    const inserted: unknown[] = [];
    for (const pattern of BASELINE_PATTERNS) {
      try {
        const { data, error } = await supabase
          .from('learning_patterns')
          .insert([pattern])
          .select();

        if (error) {
          console.warn(`⚠️ Error insertando patrón ${pattern.task_type}:`, error);
        } else {
          inserted.push(data?.[0]);
        }
      } catch (err) {
        console.warn(`⚠️ Excepción en patrón ${pattern.task_type}:`, err);
      }
    }

    console.log(`✅ Seed completado: ${inserted.length}/${BASELINE_PATTERNS.length} patrones insertados`);

    return NextResponse.json(
      {
        success: true,
        message: `✅ ${inserted.length}/${BASELINE_PATTERNS.length} patrones baseline insertados`,
        inserted: inserted.length,
        total: BASELINE_PATTERNS.length,
        patterns: BASELINE_PATTERNS.map((p) => ({
          task_type: p.task_type,
          agents: p.agents_used.length,
          score: p.score,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error en seed-baseline:', error);
    return NextResponse.json(
      { error: 'Error insertando baseline patterns', details: String(error) },
      { status: 500 }
    );
  }
}
