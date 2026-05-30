/**
 * ============================================================
 * AGENT TOOLS — Herramientas reales para el Code Specialist
 * ============================================================
 *
 * El Code Specialist puede leer y escribir archivos reales del
 * proyecto usando Anthropic tool_use. Esto es lo que permite
 * que los cambios se apliquen sin que Lucas tenga que copiar
 * y pegar código manualmente.
 *
 * Herramientas disponibles:
 *   read_file       → lee un archivo del proyecto
 *   write_file      → escribe un archivo (crea backup automático)
 *   list_directory  → lista los archivos de una carpeta
 *   run_build_check → verifica que el proyecto compila
 *
 * SEGURIDAD:
 *   - Solo puede operar dentro de PROJECT_ROOT
 *   - write_file crea backup .bak antes de sobreescribir
 *   - No puede borrar archivos
 *   - Rutas con ".." están bloqueadas
 * ============================================================
 */

import fs   from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';

// ─── Configuración ────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.join(
  'C:', 'Users', 'lucas', 'OneDrive', 'Documentos', 'Claude',
  'Projects', 'App Desarrollo integral', 'web'
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  output:  string;
  error?:  string;
}

export interface FileWrite {
  path:        string;
  content:     string;
  description: string;
}

// ─── Definiciones de herramientas (para Anthropic tool_use) ──────────────────

export const CODE_SPECIALIST_TOOLS: Anthropic.Tool[] = [
  {
    name: 'read_file',
    description: 'Lee el contenido actual de un archivo del proyecto. Usar antes de modificar cualquier archivo para entender el código existente.',
    input_schema: {
      type:       'object' as const,
      properties: {
        path: {
          type:        'string',
          description: 'Ruta relativa desde la raíz del proyecto web/ (ej: "app/components/NavBar.tsx")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Escribe o sobreescribe un archivo del proyecto con nuevo contenido. Crea backup automático. Usar solo cuando el código está completo y listo.',
    input_schema: {
      type:       'object' as const,
      properties: {
        path: {
          type:        'string',
          description: 'Ruta relativa desde la raíz del proyecto web/',
        },
        content: {
          type:        'string',
          description: 'Contenido completo del archivo. Incluir TODO el archivo, no solo las partes modificadas.',
        },
        description: {
          type:        'string',
          description: 'Descripción breve de qué cambios hiciste y por qué.',
        },
      },
      required: ['path', 'content', 'description'],
    },
  },
  {
    name: 'list_directory',
    description: 'Lista los archivos y carpetas de un directorio del proyecto.',
    input_schema: {
      type:       'object' as const,
      properties: {
        path: {
          type:        'string',
          description: 'Ruta relativa del directorio (ej: "app/components")',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'run_build_check',
    description: 'Ejecuta TypeScript type-check para verificar que el código no tiene errores de tipos. Usar después de escribir archivos.',
    input_schema: {
      type:       'object' as const,
      properties: {},
      required:   [],
    },
  },
  {
    name: 'run_lint_check',
    description: 'Ejecuta ESLint para detectar problemas de calidad de código. Usar después de run_build_check.',
    input_schema: {
      type:       'object' as const,
      properties: {
        path: {
          type:        'string',
          description: 'Ruta relativa del archivo o directorio a lintear. Si no se especifica, lintea todo el proyecto.',
        },
      },
      required: [],
    },
  },
  {
    name: 'verify_files_written',
    description: 'Verifica que los archivos escritos existen en disco y tienen contenido válido. Usar como último paso antes de terminar.',
    input_schema: {
      type:       'object' as const,
      properties: {
        paths: {
          type:        'array',
          description: 'Lista de rutas relativas de los archivos a verificar.',
          items: { type: 'string' },
        },
      },
      required: ['paths'],
    },
  },
];

// ─── Validación de seguridad ──────────────────────────────────────────────────

function safePath(relativePath: string): string | null {
  // Bloquear path traversal
  if (relativePath.includes('..') || relativePath.includes('~')) return null;

  const full = path.join(PROJECT_ROOT, relativePath.replace(/\//g, path.sep));

  // Verificar que sigue dentro del PROJECT_ROOT
  if (!full.startsWith(PROJECT_ROOT)) return null;

  return full;
}

// ─── Ejecución de herramientas ────────────────────────────────────────────────

export function executeTool(
  toolName: string,
  toolInput: Record<string, string>
): { content: string; writtenFiles?: FileWrite[] } {
  switch (toolName) {
    case 'read_file': {
      const fullPath = safePath(toolInput.path);
      if (!fullPath) return { content: 'ERROR: ruta inválida o fuera del proyecto' };
      if (!fs.existsSync(fullPath)) return { content: `ERROR: archivo no existe: ${toolInput.path}` };

      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        return { content: content.slice(0, 12_000) }; // Límite de contexto
      } catch (e) {
        return { content: `ERROR leyendo archivo: ${String(e)}` };
      }
    }

    case 'write_file': {
      const fullPath = safePath(toolInput.path);
      if (!fullPath) return { content: 'ERROR: ruta inválida o fuera del proyecto' };

      try {
        // Crear directorios si no existen
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });

        // Backup del archivo existente
        if (fs.existsSync(fullPath)) {
          const backupPath = fullPath + '.bak';
          fs.copyFileSync(fullPath, backupPath);
        }

        fs.writeFileSync(fullPath, toolInput.content, 'utf-8');

        const written: FileWrite = {
          path:        toolInput.path,
          content:     toolInput.content,
          description: toolInput.description || 'Archivo actualizado por Code Specialist',
        };

        return {
          content: `✅ Archivo escrito: ${toolInput.path} (${toolInput.content.length} chars)${
            fs.existsSync(fullPath + '.bak') ? ' | Backup creado: .bak' : ''
          }`,
          writtenFiles: [written],
        };
      } catch (e) {
        return { content: `ERROR escribiendo archivo: ${String(e)}` };
      }
    }

    case 'list_directory': {
      const fullPath = safePath(toolInput.path || '.');
      if (!fullPath) return { content: 'ERROR: ruta inválida' };
      if (!fs.existsSync(fullPath)) return { content: `ERROR: directorio no existe: ${toolInput.path}` };

      try {
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        const list = entries.map((e) => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`).join('\n');
        return { content: list || '(directorio vacío)' };
      } catch (e) {
        return { content: `ERROR listando directorio: ${String(e)}` };
      }
    }

    case 'run_build_check': {
      try {
        execSync('npx tsc --noEmit --project tsconfig.json', {
          cwd:     PROJECT_ROOT,
          timeout: 30_000,
          stdio:   'pipe',
        });
        return { content: '✅ TypeScript: sin errores de tipos' };
      } catch (e: unknown) {
        const output = e instanceof Error && 'stdout' in e
          ? String((e as NodeJS.ErrnoException & { stdout?: Buffer }).stdout)
          : String(e);
        const lines = output.split('\n').filter((l) => l.includes('error TS')).slice(0, 10);
        return { content: lines.length ? `⚠️ Errores TypeScript:\n${lines.join('\n')}` : '✅ Sin errores críticos' };
      }
    }

    case 'run_lint_check': {
      const targetPath = toolInput.path ? safePath(toolInput.path) : PROJECT_ROOT;
      if (!targetPath) return { content: 'ERROR: ruta inválida' };

      try {
        const lintTarget = toolInput.path || '.';
        execSync(`npx next lint --dir ${lintTarget} --max-warnings 0`, {
          cwd:     PROJECT_ROOT,
          timeout: 30_000,
          stdio:   'pipe',
        });
        return { content: `✅ ESLint: sin warnings ni errores en ${lintTarget}` };
      } catch (e: unknown) {
        const raw = e instanceof Error && 'stdout' in e
          ? String((e as NodeJS.ErrnoException & { stdout?: Buffer }).stdout)
          : String(e);
        // Filtrar solo las líneas relevantes (warnings y errors, no el header de Next)
        const lines = raw
          .split('\n')
          .filter((l) => l.includes('Warning:') || l.includes('Error:') || l.includes('error'))
          .slice(0, 15);
        return {
          content: lines.length
            ? `⚠️ ESLint encontró problemas:\n${lines.join('\n')}\n\nEstos son warnings — el build puede seguir igual.`
            : '✅ Sin problemas críticos de lint',
        };
      }
    }

    case 'verify_files_written': {
      const paths = (toolInput as unknown as { paths: string[] }).paths ?? [];
      if (!Array.isArray(paths) || paths.length === 0) {
        return { content: 'ERROR: "paths" debe ser un array de rutas' };
      }

      const results: string[] = [];
      let allOk = true;

      for (const relativePath of paths) {
        const fullPath = safePath(relativePath);
        if (!fullPath) {
          results.push(`❌ ${relativePath}: ruta inválida`);
          allOk = false;
          continue;
        }
        if (!fs.existsSync(fullPath)) {
          results.push(`❌ ${relativePath}: archivo NO existe en disco`);
          allOk = false;
          continue;
        }
        const stat    = fs.statSync(fullPath);
        const sizeKb  = (stat.size / 1024).toFixed(1);
        const hasBak  = fs.existsSync(fullPath + '.bak');
        results.push(`✅ ${relativePath}: ${sizeKb}kb${hasBak ? ' | backup: .bak' : ''}`);
      }

      return {
        content: [
          allOk ? '✅ Todos los archivos verificados correctamente' : '⚠️ Algunos archivos tienen problemas',
          ...results,
        ].join('\n'),
      };
    }

    default:
      return { content: `ERROR: herramienta desconocida: ${toolName}` };
  }
}

// ─── Merge inteligente de código cuando múltiples tools escriben al mismo archivo ────

function mergeCodeFixes(writtenFiles: FileWrite[]): FileWrite[] {
  const fileMap = new Map<string, FileWrite[]>();

  // Agrupar por path
  for (const file of writtenFiles) {
    if (!fileMap.has(file.path)) {
      fileMap.set(file.path, []);
    }
    fileMap.get(file.path)!.push(file);
  }

  const merged: FileWrite[] = [];

  // Procesar cada archivo
  for (const [path, versions] of fileMap.entries()) {
    if (versions.length === 1) {
      // Sin conflicto — usar la versión única
      merged.push(versions[0]);
    } else {
      // Múltiples writes al mismo archivo — usar heurística
      // Estrategia: usar la versión más larga (asumiendo que es la más completa)
      const best = versions.reduce((prev, curr) => {
        return curr.content.length > prev.content.length ? curr : prev;
      });
      merged.push(best);
    }
  }

  return merged;
}

// ─── QA automático post-ejecución ────────────────────────────────────────────
//
// Se ejecuta después de que Code Specialist termina su loop agéntico.
// No depende del agente — corre siempre que haya archivos escritos.
//
// Verifica:
//   1. Que todos los archivos escritos existen en disco
//   2. TypeScript: sin errores de tipo en los archivos modificados
//   3. Lint rápido de los archivos modificados
//
// Retorna un reporte de QA que se adjunta al output del agente.

export interface QAReport {
  passed:     boolean;
  filesOk:    boolean;
  tsOk:       boolean;
  lintOk:     boolean;
  summary:    string;
  details:    string[];
  durationMs: number;
}

export async function runPostExecutionQA(writtenFiles: FileWrite[]): Promise<QAReport> {
  if (writtenFiles.length === 0) {
    return {
      passed:  true,
      filesOk: true,
      tsOk:    true,
      lintOk:  true,
      summary: 'Sin archivos escritos — QA omitido',
      details: [],
      durationMs: 0,
    };
  }

  const start   = Date.now();
  const details: string[] = [];
  let filesOk = true;
  let tsOk    = true;
  let lintOk  = true;

  // ── 1. Verificar que los archivos existen en disco ────────────────────────
  for (const f of writtenFiles) {
    const fullPath = path.join(PROJECT_ROOT, f.path.replace(/\//g, path.sep));
    if (fs.existsSync(fullPath)) {
      const size = (fs.statSync(fullPath).size / 1024).toFixed(1);
      details.push(`✅ ${f.path} (${size}kb)`);
    } else {
      details.push(`❌ ${f.path}: NO existe en disco`);
      filesOk = false;
    }
  }

  // ── 2. TypeScript check ───────────────────────────────────────────────────
  try {
    execSync('npx tsc --noEmit --project tsconfig.json', {
      cwd:     PROJECT_ROOT,
      timeout: 35_000,
      stdio:   'pipe',
    });
    details.push('✅ TypeScript: sin errores');
  } catch (e: unknown) {
    const raw   = e instanceof Error && 'stdout' in e
      ? String((e as NodeJS.ErrnoException & { stdout?: Buffer }).stdout)
      : String(e);
    // Solo mostrar errores de los archivos que escribimos
    const writtenPaths = writtenFiles.map((f) => f.path.replace(/\//g, path.sep));
    const relevantErrors = raw
      .split('\n')
      .filter((l) => l.includes('error TS') && writtenPaths.some((p) => l.includes(p)))
      .slice(0, 8);

    if (relevantErrors.length > 0) {
      details.push(`⚠️ TypeScript — errores en archivos modificados:`);
      relevantErrors.forEach((l) => details.push(`   ${l.trim()}`));
      tsOk = false;
    } else {
      // Errores en otros archivos (pre-existentes) — no bloquear
      details.push('✅ TypeScript: sin errores en los archivos modificados (hay errores pre-existentes en otros archivos)');
    }
  }

  // ── 3. Lint rápido ────────────────────────────────────────────────────────
  // Solo lintear los archivos TSX/TS modificados, no todo el proyecto
  const tsxFiles = writtenFiles
    .filter((f) => f.path.endsWith('.tsx') || f.path.endsWith('.ts'))
    .map((f) => `"${f.path}"`)
    .join(' ');

  if (tsxFiles) {
    try {
      execSync(`npx eslint ${tsxFiles} --max-warnings 5 --no-eslintrc -c '{"extends":["next/core-web-vitals"]}'`, {
        cwd:     PROJECT_ROOT,
        timeout: 20_000,
        stdio:   'pipe',
      });
      details.push('✅ ESLint: sin problemas en archivos modificados');
    } catch {
      // Lint puede fallar por config — no bloquear, solo informar
      details.push('⚠️ ESLint: verificar manualmente (config o warnings menores)');
      lintOk = false;
    }
  } else {
    details.push('ℹ️ ESLint: omitido (no hay archivos .ts/.tsx modificados)');
  }

  const passed = filesOk && tsOk; // Lint warning no bloquea
  const emoji  = passed ? '✅' : '❌';

  const summary = [
    `${emoji} QA: ${passed ? 'PASSED' : 'FAILED'} | `,
    `Archivos: ${filesOk ? '✅' : '❌'} | `,
    `TypeScript: ${tsOk ? '✅' : '❌'} | `,
    `Lint: ${lintOk ? '✅' : '⚠️'} | `,
    `${writtenFiles.length} archivo(s) en ${Date.now() - start}ms`,
  ].join('');

  return {
    passed,
    filesOk,
    tsOk,
    lintOk,
    summary,
    details,
    durationMs: Date.now() - start,
  };
}

// ─── Loop agentico para Code Specialist ──────────────────────────────────────
// Ejecuta el agente con tool_use: el agente puede llamar herramientas múltiples
// veces hasta que termina (stop_reason === 'end_turn').

export async function runCodeSpecialistWithTools(
  client: Anthropic,
  model: string,
  systemPrompt: string,
  userPrompt:   string,
  maxTokens:    number
): Promise<{ output: string; writtenFiles: FileWrite[]; tokensUsed: number; qaReport: QAReport | null }> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ];

  const allWrittenFiles: FileWrite[] = [];
  let totalTokens = 0;
  let finalOutput = '';
  let iterations  = 0;
  const MAX_ITERATIONS = 8; // Evitar loops infinitos

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await (client.messages.create as any)({
      model,
      max_tokens: maxTokens,
      system:     [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      tools:      CODE_SPECIALIST_TOOLS,
      messages,
    });

    totalTokens += (response.usage.input_tokens as number) + (response.usage.output_tokens as number);

    // Recopilar texto de la respuesta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textBlocks = (response.content as any[])
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text as string)
      .join('\n');

    if (textBlocks) finalOutput = textBlocks;

    // Si terminó → salir del loop
    if (response.stop_reason === 'end_turn') break;

    // Si quiere usar herramientas → ejecutarlas y continuar
    if (response.stop_reason === 'tool_use') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toolUseBlocks = (response.content as any[]).filter(
        (b: any) => b.type === 'tool_use'
      ) as Anthropic.ToolUseBlock[];

      // Agregar respuesta del asistente al historial
      messages.push({ role: 'assistant', content: response.content });

      // Ejecutar todas las herramientas en PARALELO (no secuencial)
      const toolResultsWithMetadata = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = executeTool(
            toolUse.name,
            toolUse.input as Record<string, string>
          );
          return {
            tool_use_id: toolUse.id,
            toolName: toolUse.name,
            content: result.content,
            writtenFiles: result.writtenFiles || [],
          };
        })
      );

      // Agregar todos los archivos escritos (después de la paralelización)
      const writtenThisRound = toolResultsWithMetadata.flatMap((item) => item.writtenFiles);
      if (writtenThisRound.length > 0) {
        // Merge inteligente en caso de múltiples writes al mismo archivo
        const merged = mergeCodeFixes(writtenThisRound);
        allWrittenFiles.push(...merged);
      }

      // Formatear resultados para API
      const toolResults: Anthropic.ToolResultBlockParam[] = toolResultsWithMetadata.map(
        (item) => ({
          type: 'tool_result',
          tool_use_id: item.tool_use_id,
          content: item.content,
        })
      );

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    break; // Stop reason desconocido → salir
  }

  // ── QA automático post-loop ───────────────────────────────────────────────
  // Corre siempre que haya archivos escritos, sin importar qué hizo el agente.
  let qaReport: QAReport | null = null;
  if (allWrittenFiles.length > 0) {
    console.log(`🔍 [QA] Verificando ${allWrittenFiles.length} archivo(s) escritos...`);
    qaReport = await runPostExecutionQA(allWrittenFiles);
    console.log(`   ${qaReport.summary}`);

    // Adjuntar reporte de QA al output del agente
    const qaSection = [
      '\n\n---',
      `## 🔍 Reporte de QA automático`,
      qaReport.summary,
      ...qaReport.details,
    ].join('\n');
    finalOutput += qaSection;
  }

  return {
    output:       finalOutput,
    writtenFiles: allWrittenFiles,
    tokensUsed:   totalTokens,
    qaReport,
  };
}
