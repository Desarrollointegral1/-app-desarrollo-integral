#!/usr/bin/env node
/**
 * update-docs.js
 * ──────────────
 * Actualiza docs/CEREBRO.md con el último resultado de coalición
 * y hace git commit + push al repo de GitHub.
 *
 * Uso:
 *   node scripts/update-docs.js                    # solo commit+push si hubo cambios
 *   node scripts/update-docs.js --log "mensaje"    # agrega entrada al historial
 *   node scripts/update-docs.js --coalition        # actualiza sección "Última coalición"
 *
 * Llamado automáticamente por el Stop hook de Claude Code.
 */

const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ROOT      = path.resolve(__dirname, '..');
const CEREBRO   = path.join(ROOT, 'docs', 'CEREBRO.md');
const DESINT    = path.join(ROOT, 'docs', 'DESARROLLO-INTEGRAL.md');
const COALITION_LOG = path.join(ROOT, 'docs', '.coalition-log.json');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return '';
  }
}

function hasChanges() {
  const status = run('git status --porcelain docs/');
  return status.length > 0;
}

function updateTimestamp(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  const today   = new Date().toISOString().slice(0, 10);
  const updated = content.replace(
    /\*\*Última actualización:\*\* .+/,
    `**Última actualización:** ${today}`
  );
  if (updated !== content) fs.writeFileSync(filePath, updated, 'utf-8');
}

function appendCoalitionLog(entry) {
  // Lee log existente o empieza array vacío
  let log = [];
  if (fs.existsSync(COALITION_LOG)) {
    try { log = JSON.parse(fs.readFileSync(COALITION_LOG, 'utf-8')); } catch { log = []; }
  }
  log.unshift(entry); // más reciente primero
  if (log.length > 50) log = log.slice(0, 50); // máx 50 entradas
  fs.writeFileSync(COALITION_LOG, JSON.stringify(log, null, 2), 'utf-8');

  // Actualizar sección "Historial de Coaliciones" en DESARROLLO-INTEGRAL.md
  if (fs.existsSync(DESINT)) {
    let content = fs.readFileSync(DESINT, 'utf-8');
    const section = '## Historial de Coaliciones (auto-generado)';
    const rows = log.slice(0, 10).map(e =>
      `| ${e.date} | ${e.score}/100 | ${e.agents} agentes | ${e.task.slice(0, 60)}... |`
    ).join('\n');
    const table = `${section}\n\n| Fecha | Score | Agentes | Tarea |\n|---|---|---|---|\n${rows}`;

    if (content.includes(section)) {
      content = content.replace(new RegExp(`${section}[\\s\\S]*?(?=\n---|\n## |$)`), table + '\n\n');
    } else {
      content += `\n\n${table}\n`;
    }
    fs.writeFileSync(DESINT, content, 'utf-8');
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

// Si recibe datos de una coalición por stdin (JSON)
if (args.includes('--coalition') && !process.stdin.isTTY) {
  let data = '';
  process.stdin.on('data', chunk => { data += chunk; });
  process.stdin.on('end', () => {
    try {
      const result = JSON.parse(data);
      appendCoalitionLog({
        date:   new Date().toISOString().slice(0, 10),
        score:  result.summary?.collectiveScore ?? 0,
        agents: result.coalition?.agentCount ?? 0,
        task:   result.task ?? 'sin tarea',
        time:   result.summary?.totalExecutionMs ?? 0,
      });
    } catch { /* dato inválido, ignorar */ }
    commitAndPush();
  });
  return;
}

// Actualizar timestamps
updateTimestamp(CEREBRO);
updateTimestamp(DESINT);

// Si hay un mensaje de log manual
if (args.includes('--log')) {
  const msgIdx = args.indexOf('--log') + 1;
  const msg    = args[msgIdx] || 'actualización manual';
  console.log(`[update-docs] Log: ${msg}`);
}

commitAndPush();

function commitAndPush() {
  if (!hasChanges()) {
    console.log('[update-docs] Sin cambios en docs/ — nada que commitear');
    return;
  }

  console.log('[update-docs] Cambios detectados → commit + push');
  run('git add docs/');

  const now = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  run(`git commit -m "docs: auto-update ${now}"`);

  const pushResult = run('git push origin master 2>&1 || git push origin main 2>&1');
  if (pushResult.includes('error') || pushResult.includes('fatal')) {
    console.warn('[update-docs] Push falló (sin conexión?):', pushResult.slice(0, 100));
  } else {
    console.log('[update-docs] ✅ Docs pushed a GitHub');
  }
}
