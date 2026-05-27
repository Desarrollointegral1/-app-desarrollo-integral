/**
 * ============================================================
 * CONTEXT COLLECTOR — Agente Primario de Recolección
 * ============================================================
 *
 * Se ejecuta ANTES de la coalición. Lee el proyecto real y
 * empaqueta el contexto relevante para que todos los agentes
 * trabajen sobre lo que existe, no sobre lo que imaginan.
 *
 * Flujo:
 *   1. Escanea TODOS los archivos del proyecto (dinámico)
 *   2. Matchea keywords de la tarea contra nombres de archivo reales
 *   3. Aplica mapeo semántico para archivos no-componentes (css, config)
 *   4. Incluye siempre: globals.css, tailwind.config, layout
 *   5. Devuelve ProjectContext listo para inyectar en prompts
 *
 * VENTAJA vs versión anterior:
 *   - No requiere actualizar ningún mapa cuando se agrega un componente
 *   - Cualquier archivo .tsx/.ts del proyecto es automáticamente descubrible
 *   - Los keywords se matchean contra el nombre real del archivo en disco
 * ============================================================
 */

import fs   from 'fs';
import path from 'path';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FileSnapshot {
  relativePath: string;
  content:      string;
  sizeChars:    number;
  truncated:    boolean;
}

export interface ProjectContext {
  files:          FileSnapshot[];
  componentsList: string[];       // componentes detectados en /components
  routesList:     string[];       // rutas en /app
  summary:        string;         // resumen legible para el prompt
  collectedAt:    string;
  totalChars:     number;
}

// ─── Configuración ────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.join(
  'C:', 'Users', 'lucas', 'OneDrive', 'Documentos', 'Claude',
  'Projects', 'App Desarrollo integral', 'web'
);

const MAX_FILE_CHARS  = 8_000;   // Máx chars por archivo
const MAX_TOTAL_CHARS = 40_000;  // Máx chars totales del contexto
const MIN_KEYWORD_LEN = 4;       // Keywords de al menos 4 chars para matchear

// Archivos que SIEMPRE se incluyen (contexto base del proyecto)
const ALWAYS_INCLUDE: string[] = [
  'app/globals.css',
  'tailwind.config.ts',
  'app/layout.tsx',
];

// Mapeo semántico MÍNIMO: palabras que no coinciden con nombres de archivo
// Solo para archivos de configuración o con nombres muy distintos al keyword
const SEMANTIC_MAP: Record<string, string[]> = {
  // Estilos / configuración
  estilos:      ['app/globals.css', 'tailwind.config.ts'],
  css:          ['app/globals.css'],
  tailwind:     ['tailwind.config.ts'],
  colores:      ['app/globals.css', 'tailwind.config.ts'],
  animacion:    ['app/globals.css'],
  animaciones:  ['app/globals.css'],
  spacing:      ['app/globals.css'],
  tipografia:   ['app/globals.css', 'app/layout.tsx'],
  fuente:       ['app/globals.css', 'app/layout.tsx'],
  font:         ['app/globals.css', 'app/layout.tsx'],

  // Páginas y rutas
  landing:      ['app/page.tsx'],
  home:         ['app/page.tsx'],
  inicio:       ['app/page.tsx'],
  page:         ['app/page.tsx'],

  // Configuración del servidor
  config:       ['next.config.ts', 'tailwind.config.ts'],
  performance:  ['next.config.ts'],
  security:     ['next.config.ts'],
  headers:      ['next.config.ts'],

  // Sistema de agentes (para tareas internas)
  agentes:      ['lib/parallel-agents.ts'],
  coalition:    ['lib/parallel-agents.ts', 'app/api/coalition/route.ts'],
  supabase:     ['lib/supabase-agents.ts'],
  api:          ['app/api/coalition/route.ts'],
};

// Directorios a escanear para descubrimiento dinámico
const SCAN_DIRS = [
  'app/components',
  'app/sections',    // por si el proyecto usa /sections en lugar de /components
  'components',      // raíz del proyecto
];

// ─── Descubrimiento dinámico de archivos ──────────────────────────────────────

interface DiscoveredFile {
  relativePath:  string;
  nameTokens:    string[];  // tokens del nombre del archivo en minúsculas
}

/**
 * Escanea los directorios del proyecto y devuelve todos los archivos .tsx/.ts
 * con sus tokens de nombre para matcheo semántico.
 */
function discoverProjectFiles(): DiscoveredFile[] {
  const discovered: DiscoveredFile[] = [];

  for (const scanDir of SCAN_DIRS) {
    const fullDir = path.join(PROJECT_ROOT, scanDir.replace(/\//g, path.sep));
    if (!fs.existsSync(fullDir)) continue;

    try {
      const entries = fs.readdirSync(fullDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;

        const relativePath = `${scanDir}/${entry.name}`;
        // Extraer tokens del nombre: "NavBar.tsx" → ["nav", "bar", "navbar"]
        const baseName   = entry.name.replace(/\.(tsx|ts)$/, '');
        const tokens     = splitCamelAndKebab(baseName);

        discovered.push({ relativePath, nameTokens: tokens });
      }
    } catch { /* skip directorios inaccesibles */ }
  }

  return discovered;
}

/**
 * Divide un nombre CamelCase o kebab-case en tokens.
 * "NavBar"          → ["nav", "bar", "navbar"]
 * "HeroSection"     → ["hero", "section", "herosection"]
 * "cta-form"        → ["cta", "form", "ctaform"]
 * "TestimonialSlider" → ["testimonial", "slider", "testimonialslider"]
 */
function splitCamelAndKebab(name: string): string[] {
  const lower = name.toLowerCase();
  // Dividir por camelCase: insertar espacio antes de mayúsculas
  const parts = name
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .split(/[\s\-_]+/)
    .filter(Boolean);

  // Incluir el nombre completo sin separadores como token adicional
  return [...new Set([...parts, lower.replace(/[\-_]/g, '')])];
}

/**
 * Dado un keyword de la tarea, encuentra archivos cuyo nombre lo contiene.
 * Matching flexible: "navbar" matchea "NavBar.tsx", "nav" matchea "NavBar.tsx",
 * "servicios" matchea "ServicesSection.tsx" solo si hay token "servicios".
 */
function findFilesByKeyword(keyword: string, discovered: DiscoveredFile[]): string[] {
  const kw = keyword.toLowerCase();
  const matches: string[] = [];

  for (const file of discovered) {
    const matchesToken = file.nameTokens.some((token) => {
      // Match exacto de token
      if (token === kw) return true;
      // Match por prefijo (5+ chars): "testimonial" matchea "testimonio"
      if (kw.length >= 5 && token.length >= 5) {
        if (token.startsWith(kw.slice(0, 5)) || kw.startsWith(token.slice(0, 5))) return true;
      }
      // Match por substring directo en el nombre completo del archivo
      const fullName = file.relativePath.toLowerCase();
      if (fullName.includes(kw)) return true;

      return false;
    });

    if (matchesToken) matches.push(file.relativePath);
  }

  return matches;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFileSafe(relativePath: string, maxChars: number): FileSnapshot | null {
  const fullPath = path.join(PROJECT_ROOT, relativePath.replace(/\//g, path.sep));
  if (!fs.existsSync(fullPath)) return null;

  try {
    const raw       = fs.readFileSync(fullPath, 'utf-8');
    const truncated = raw.length > maxChars;
    return {
      relativePath,
      content:   truncated ? raw.slice(0, maxChars) + '\n// ... [truncado por tamaño]' : raw,
      sizeChars: raw.length,
      truncated,
    };
  } catch {
    return null;
  }
}

function listComponents(): string[] {
  const results: string[] = [];
  for (const scanDir of SCAN_DIRS) {
    const dir = path.join(PROJECT_ROOT, scanDir.replace(/\//g, path.sep));
    if (!fs.existsSync(dir)) continue;
    try {
      fs.readdirSync(dir)
        .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
        .forEach((f) => results.push(f.replace(/\.(tsx|ts)$/, '')));
    } catch { /* skip */ }
  }
  return [...new Set(results)];
}

function listRoutes(): string[] {
  const appDir = path.join(PROJECT_ROOT, 'app');
  if (!fs.existsSync(appDir)) return [];

  const routes: string[] = [];
  const scan = (dir: string, base: string) => {
    try {
      fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
        if (entry.isDirectory()) {
          scan(path.join(dir, entry.name), `${base}/${entry.name}`);
        } else if (entry.name === 'page.tsx') {
          routes.push(base || '/');
        }
      });
    } catch { /* skip */ }
  };
  scan(appDir, '');
  return routes;
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function collectProjectContext(
  taskDescription: string
): Promise<ProjectContext> {
  const taskLower  = taskDescription.toLowerCase();
  const collected  = new Map<string, FileSnapshot>();
  let totalChars   = 0;

  // Escanear archivos del proyecto una sola vez
  const discovered = discoverProjectFiles();

  // Extraer keywords de la tarea (mínimo 4 chars, sin stopwords)
  const STOPWORDS = new Set(['para', 'que', 'con', 'del', 'los', 'las', 'una', 'este', 'esta', 'como', 'cuando', 'quiero', 'hace', 'hacer', 'más', 'por', 'pero', 'todo', 'toda', 'todos', 'cada', 'from', 'with', 'that', 'this', 'the', 'and']);
  const taskKeywords = taskLower
    .split(/\s+|[,;.!?()\[\]{}"'\/\\]/)
    .filter((w) => w.length >= MIN_KEYWORD_LEN && !STOPWORDS.has(w));

  const addFile = (relativePath: string): boolean => {
    if (collected.has(relativePath)) return true;
    if (totalChars >= MAX_TOTAL_CHARS) return false;
    const remaining = MAX_TOTAL_CHARS - totalChars;
    const snapshot  = readFileSafe(relativePath, Math.min(MAX_FILE_CHARS, remaining));
    if (snapshot) {
      collected.set(relativePath, snapshot);
      totalChars += snapshot.content.length;
      return true;
    }
    return false;
  };

  // 1. Archivos siempre incluidos (base del proyecto)
  for (const filePath of ALWAYS_INCLUDE) {
    addFile(filePath);
  }

  // 2. Descubrimiento dinámico: keywords → archivos reales en disco
  for (const keyword of taskKeywords) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    const dynamicMatches = findFilesByKeyword(keyword, discovered);
    for (const filePath of dynamicMatches) {
      if (totalChars >= MAX_TOTAL_CHARS) break;
      addFile(filePath);
    }
  }

  // 3. Mapeo semántico (solo para keywords que no matchean nombres de archivo)
  for (const [keyword, files] of Object.entries(SEMANTIC_MAP)) {
    if (!taskLower.includes(keyword)) continue;
    for (const filePath of files) {
      if (totalChars >= MAX_TOTAL_CHARS) break;
      addFile(filePath);
    }
  }

  // 4. Si la tarea menciona "completo", "toda" o "landing completa" → page.tsx
  if (/complet|toda\b|todo\b|landing/i.test(taskDescription)) {
    addFile('app/page.tsx');
  }

  const files          = Array.from(collected.values());
  const componentsList = listComponents();
  const routesList     = listRoutes();
  const summary        = buildContextSummary(files, componentsList, routesList, totalChars);

  return {
    files,
    componentsList,
    routesList,
    summary,
    collectedAt: new Date().toISOString(),
    totalChars,
  };
}

// ─── Formateo para inyectar en prompt de agente ───────────────────────────────

export function formatContextForPrompt(ctx: ProjectContext): string {
  if (!ctx.files.length) return '';

  const sections: string[] = [
    '═══ CONTEXTO REAL DEL PROYECTO (archivos actuales) ═══',
    '',
    `Componentes disponibles: ${ctx.componentsList.join(', ')}`,
    `Rutas del sitio: ${ctx.routesList.join(', ')}`,
    '',
  ];

  for (const file of ctx.files) {
    sections.push(`── ${file.relativePath} ${file.truncated ? '[truncado]' : ''} ──`);
    sections.push('```');
    sections.push(file.content);
    sections.push('```');
    sections.push('');
  }

  sections.push('═══ FIN DEL CONTEXTO — trabajar sobre estos archivos reales ═══');
  return sections.join('\n');
}

function buildContextSummary(
  files: FileSnapshot[],
  components: string[],
  routes: string[],
  totalChars: number
): string {
  return [
    `📁 Contexto recolectado: ${files.length} archivos (${(totalChars / 1000).toFixed(1)}k chars)`,
    `   Archivos: ${files.map((f) => f.relativePath).join(', ')}`,
    `   Componentes en disco: ${components.length} (${components.slice(0, 6).join(', ')}${components.length > 6 ? '...' : ''})`,
    `   Rutas: ${routes.join(', ')}`,
  ].join('\n');
}
