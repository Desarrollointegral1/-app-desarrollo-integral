/**
 * ============================================================
 * API Route: /api/coalition/apply
 * Aplica al disco los archivos generados por el Code Specialist
 * ============================================================
 *
 * POST /api/coalition/apply
 * Body: {
 *   files: Array<{ path: string; content: string; description: string }>;
 *   dryRun?: boolean;          // true → solo valida rutas, no escribe
 *   coalitionId?: string;      // para logging en Supabase
 * }
 *
 * Seguridad:
 *   - Solo acepta rutas relativas (no empieza con / ni contiene ..)
 *   - Solo escribe dentro del PROJECT_ROOT
 *   - Límite: 20 archivos por request, 500 KB por archivo
 * ============================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs   from 'fs/promises';

// ─── Constantes de seguridad ──────────────────────────────────────────────────

const MAX_FILES        = 20;
const MAX_FILE_BYTES   = 500 * 1024;   // 500 KB
const PROJECT_ROOT     = process.cwd(); // /web

// Extensiones permitidas (solo código fuente)
const ALLOWED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.css', '.scss', '.json', '.md', '.mdx',
  '.svg', '.html',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface FileToApply {
  path:        string;
  content:     string;
  description: string;
}

interface ApplyResult {
  path:       string;
  status:     'written' | 'skipped' | 'error';
  reason?:    string;
  sizeBytes?: number;
}

/**
 * Valida que la ruta es segura:
 *   - Relativa (no empieza con /)
 *   - Sin path traversal (..)
 *   - Con extensión permitida
 *   - El path resuelto está dentro de PROJECT_ROOT
 */
function validatePath(relativePath: string): { ok: true; abs: string } | { ok: false; reason: string } {
  if (!relativePath || typeof relativePath !== 'string') {
    return { ok: false, reason: 'path inválido' };
  }

  // Sin path traversal
  if (relativePath.includes('..')) {
    return { ok: false, reason: 'path traversal no permitido' };
  }

  // Sin ruta absoluta
  if (path.isAbsolute(relativePath)) {
    return { ok: false, reason: 'solo se permiten rutas relativas' };
  }

  // Extensión permitida
  const ext = path.extname(relativePath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, reason: `extensión ${ext} no permitida` };
  }

  // Resuelve dentro de PROJECT_ROOT
  const abs = path.resolve(PROJECT_ROOT, relativePath);
  if (!abs.startsWith(PROJECT_ROOT + path.sep) && abs !== PROJECT_ROOT) {
    return { ok: false, reason: 'ruta fuera del proyecto' };
  }

  return { ok: true, abs };
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { files, dryRun = false, coalitionId } = body;

    // Validaciones básicas
    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'El campo "files" debe ser un array no vacío.' },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Máximo ${MAX_FILES} archivos por request. Recibidos: ${files.length}` },
        { status: 400 }
      );
    }

    const results: ApplyResult[] = [];
    let written = 0;
    let skipped = 0;
    let errors  = 0;

    for (const file of files as FileToApply[]) {
      // Validar path
      const pathCheck = validatePath(file.path);
      if (!pathCheck.ok) {
        results.push({ path: file.path, status: 'error', reason: pathCheck.reason });
        errors++;
        continue;
      }

      const abs = pathCheck.abs;

      // Validar tamaño de contenido
      const contentBytes = Buffer.byteLength(file.content, 'utf-8');
      if (contentBytes > MAX_FILE_BYTES) {
        results.push({
          path:   file.path,
          status: 'error',
          reason: `archivo demasiado grande: ${Math.round(contentBytes / 1024)}KB > 500KB`,
        });
        errors++;
        continue;
      }

      if (!file.content || typeof file.content !== 'string') {
        results.push({ path: file.path, status: 'skipped', reason: 'contenido vacío' });
        skipped++;
        continue;
      }

      if (dryRun) {
        results.push({ path: file.path, status: 'written', reason: 'dry-run (no escrito)', sizeBytes: contentBytes });
        written++;
        continue;
      }

      try {
        // Crear directorio si no existe
        await fs.mkdir(path.dirname(abs), { recursive: true });
        // Escribir archivo
        await fs.writeFile(abs, file.content, 'utf-8');
        results.push({ path: file.path, status: 'written', sizeBytes: contentBytes });
        written++;
        console.log(`[Apply] Escrito: ${file.path} (${Math.round(contentBytes / 1024)}KB)${coalitionId ? ` [${coalitionId.slice(-8)}]` : ''}`);
      } catch (fsErr) {
        const msg = fsErr instanceof Error ? fsErr.message : 'error de escritura';
        results.push({ path: file.path, status: 'error', reason: msg });
        errors++;
        console.error(`[Apply] Error escribiendo ${file.path}:`, msg);
      }
    }

    const summary = dryRun
      ? `Dry-run: ${written} archivos validados`
      : `${written} escrito(s), ${skipped} omitido(s), ${errors} error(es)`;

    console.log(`[Apply] ${summary}${coalitionId ? ` · coalition=${coalitionId.slice(-8)}` : ''}`);

    return NextResponse.json({
      success: errors === 0,
      dryRun,
      summary,
      stats: { written, skipped, errors, total: files.length },
      results,
      coalitionId: coalitionId ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    console.error('[Apply] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── GET — documentación del endpoint ────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/coalition/apply',
    description: 'Aplica al disco los archivos generados por el Code Specialist de la coalición',
    security: {
      maxFiles:         MAX_FILES,
      maxFileSizeKB:    MAX_FILE_BYTES / 1024,
      allowedExtensions: [...ALLOWED_EXTENSIONS],
      pathRestriction:  'Solo rutas relativas dentro del proyecto, sin path traversal',
    },
    usage: {
      method: 'POST',
      body: {
        files: 'Array<{ path: string; content: string; description: string }>',
        dryRun: 'boolean (default: false) — validar sin escribir',
        coalitionId: 'string (opcional) — para logging',
      },
    },
    notes: [
      'Los archivos del Code Specialist se obtienen de result.filesToWrite en /api/coalition',
      'El endpoint escribe en process.cwd() (raíz del proyecto Next.js)',
      'Crea directorios automáticamente si no existen',
    ],
  });
}
