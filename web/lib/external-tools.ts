/**
 * ============================================================
 * EXTERNAL TOOLS — Integración con Adobe y BrightData
 * ============================================================
 *
 * Cuando Design Specialist menciona "adobe-batch-edit-photos"
 * o Research Specialist menciona "brightdata:competitive-intel",
 * estas funciones permiten que el sistema los invoque realmente.
 *
 * Arquitectura:
 *   1. detectExternalToolRequests() parsea el output de un agente
 *      y detecta si pidió una herramienta externa
 *   2. executeExternalTool() la ejecuta vía MCP o API directa
 *   3. El resultado se inyecta de vuelta al agente como contexto
 *
 * ESTADO ACTUAL:
 *   - Adobe: MCP disponible (adobe-for-creativity en skills)
 *     → Se invoca desde Charles en Claude Code, no desde la API web
 *   - BrightData: MCP disponible (brightdata-plugin en skills)
 *     → Se invoca desde Charles en Claude Code, no desde la API web
 *
 * LIMITACIÓN:
 *   Los MCPs solo corren en el contexto de Claude Code (CLI).
 *   Desde la API Next.js no podemos invocar MCPs directamente.
 *   Solución: cuando el sistema detecta que se necesita un MCP,
 *   genera instrucciones para que Charles lo ejecute en Claude Code.
 * ============================================================
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ExternalToolRequest {
  tool:        string;          // "adobe-batch-edit-photos", "brightdata:competitive-intel"
  args:        Record<string, string>;
  requestedBy: string;          // agentId que lo pidió
  reason:      string;          // para qué lo necesita
}

export interface ExternalToolResult {
  tool:    string;
  success: boolean;
  output:  string;
  error?:  string;
}

// ─── Herramientas Adobe detectables ──────────────────────────────────────────

const ADOBE_TOOLS = [
  'adobe-batch-edit-photos',
  'adobe-create-social-variations',
  'adobe-design-from-template',
  'adobe-retouch-portraits',
  'adobe-resize-photos-and-videos',
  'adobe-edit-quick-cut',
];

// ─── Herramientas BrightData detectables ─────────────────────────────────────

const BRIGHTDATA_TOOLS = [
  'brightdata:competitive-intel',
  'brightdata:seo-audit',
  'brightdata:search',
  'brightdata:scraper-builder',
  'brightdata:data-feeds',
  'competitive-intel',
  'seo-audit',
];

// ─── Detector de requests en output de agentes ───────────────────────────────

/**
 * Parsea el output de un agente y detecta si pidió ejecutar una herramienta externa.
 * Los agentes señalan esto con patrones como:
 *   "USAR: adobe-batch-edit-photos para [razón]"
 *   "INVOCAR: brightdata:competitive-intel"
 *   "TOOL: adobe-create-social-variations"
 */
export function detectExternalToolRequests(
  agentOutput: string,
  agentId:     string
): ExternalToolRequest[] {
  const requests: ExternalToolRequest[] = [];
  const lower = agentOutput.toLowerCase();

  // Detectar herramientas Adobe
  for (const tool of ADOBE_TOOLS) {
    if (lower.includes(tool.toLowerCase())) {
      // Extraer razón del contexto alrededor del tool
      const idx    = lower.indexOf(tool.toLowerCase());
      const context = agentOutput.slice(Math.max(0, idx - 50), idx + 150);
      requests.push({
        tool,
        args: {},
        requestedBy: agentId,
        reason: context.trim(),
      });
    }
  }

  // Detectar herramientas BrightData
  for (const tool of BRIGHTDATA_TOOLS) {
    if (lower.includes(tool.toLowerCase())) {
      const idx     = lower.indexOf(tool.toLowerCase());
      const context = agentOutput.slice(Math.max(0, idx - 50), idx + 150);
      requests.push({
        tool: tool.startsWith('brightdata:') ? tool : `brightdata:${tool}`,
        args: {},
        requestedBy: agentId,
        reason: context.trim(),
      });
    }
  }

  // Deduplicar por tool
  const seen = new Set<string>();
  return requests.filter((r) => {
    if (seen.has(r.tool)) return false;
    seen.add(r.tool);
    return true;
  });
}

/**
 * Genera las instrucciones para que Charles ejecute las herramientas externas
 * desde Claude Code (donde los MCPs están disponibles).
 *
 * Retorna un bloque de texto que se adjunta al output de la coalición,
 * indicando exactamente qué ejecutar.
 */
export function generateCharlesInstructions(
  requests: ExternalToolRequest[]
): string {
  if (requests.length === 0) return '';

  const lines: string[] = [
    '',
    '═══ HERRAMIENTAS EXTERNAS REQUERIDAS (ejecutar con /charles) ═══',
    '',
  ];

  for (const req of requests) {
    const isAdobe      = req.tool.startsWith('adobe-');
    const isBrightData = req.tool.startsWith('brightdata:');

    if (isAdobe) {
      lines.push(`📸 Adobe — ${req.tool}`);
      lines.push(`   Pedido por: ${req.requestedBy}`);
      lines.push(`   Contexto: ${req.reason.slice(0, 200)}`);
      lines.push(`   → En Claude Code: usar skill adobe-for-creativity:${req.tool}`);
    } else if (isBrightData) {
      const bdTool = req.tool.replace('brightdata:', '');
      lines.push(`🌐 BrightData — ${bdTool}`);
      lines.push(`   Pedido por: ${req.requestedBy}`);
      lines.push(`   Contexto: ${req.reason.slice(0, 200)}`);
      lines.push(`   → En Claude Code: usar skill brightdata-plugin:${bdTool}`);
    }
    lines.push('');
  }

  lines.push('═══ Para ejecutar: /charles + la instrucción del agente ═══');

  return lines.join('\n');
}

/**
 * Versión simplificada para verificar si un output tiene requests pendientes.
 * Usado para agregar una nota visual en la UI de coalición.
 */
export function hasExternalToolRequests(agentOutput: string): boolean {
  const lower = agentOutput.toLowerCase();
  return (
    ADOBE_TOOLS.some((t) => lower.includes(t.toLowerCase())) ||
    BRIGHTDATA_TOOLS.some((t) => lower.includes(t.toLowerCase()))
  );
}
