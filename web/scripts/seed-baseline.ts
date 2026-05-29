/**
 * ============================================================
 * SEED BASELINE PATTERNS
 * Script para insertar datos iniciales en learning_patterns
 * ============================================================
 *
 * Uso:
 *   npx ts-node scripts/seed-baseline.ts
 *
 * Este script inserta patrones de éxito baseline que permiten
 * que el learning loop del sistema funcione desde el inicio.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function seedBaseline() {
  console.log('🌱 Insertando patrones baseline en learning_patterns...\n');

  try {
    const { data, error } = await supabase
      .from('learning_patterns')
      .insert(BASELINE_PATTERNS);

    if (error) {
      console.error('❌ Error insertando patrones:', error);
      process.exit(1);
    }

    console.log(`✅ ${BASELINE_PATTERNS.length} patrones baseline insertados correctamente\n`);
    console.log('Patrones creados:');
    BASELINE_PATTERNS.forEach((p) => {
      console.log(`  • ${p.task_type.padEnd(20)} — ${p.agents_used.length} agentes, score ${p.score}`);
    });

    console.log('\n📊 Estado:');
    console.log('  • Baseline data = punto de referencia inicial');
    console.log('  • El sistema ahora puede usar learning loop desde el inicio');
    console.log('  • Confidence scores se ajustarán con uso real\n');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

seedBaseline();
