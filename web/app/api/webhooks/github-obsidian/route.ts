import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verificar firma del webhook de GitHub
function verifyGitHubWebhook(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  const expectedSignature = `sha256=${hash}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Mapear carpetas de Obsidian a dominios de Brain Factory
const FOLDER_TO_DOMAIN: Record<string, string> = {
  'obsidian/nutricion': 'nutrition',
  'obsidian/nutrition': 'nutrition',
  'obsidian/entrenamiento': 'training',
  'obsidian/training': 'training',
  'obsidian/fisioterapia': 'physiotherapy',
  'obsidian/physiotherapy': 'physiotherapy',
  'obsidian/desarrollo': 'development',
  'obsidian/development': 'development',
};

interface GitHubPush {
  repository: {
    name: string;
    url: string;
  };
  commits: Array<{
    id: string;
    message: string;
    modified: string[];
    added: string[];
    removed: string[];
  }>;
  ref: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';

    // Verificar firma del webhook
    if (!verifyGitHubWebhook(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data: GitHubPush = JSON.parse(payload);

    // Solo procesar pushes a main/master
    if (!data.ref.match(/(main|master)$/)) {
      return NextResponse.json({ skipped: 'Not main/master' });
    }

    console.log(`🪝 GitHub Webhook recibido para ${data.repository.name}`);

    const changedFiles = [
      ...data.commits.flatMap(c => [...c.added, ...c.modified]),
    ];

    console.log(`📝 Archivos modificados: ${changedFiles.length}`);

    // Procesar cada archivo
    const results = [];

    for (const filePath of changedFiles) {
      // Solo procesar markdown
      if (!filePath.endsWith('.md')) continue;

      // Detectar dominio por carpeta
      let domain: string | null = null;
      for (const [folder, dom] of Object.entries(FOLDER_TO_DOMAIN)) {
        if (filePath.includes(folder)) {
          domain = dom;
          break;
        }
      }

      if (!domain) {
        console.log(`⏭️  ${filePath} - no detectó dominio`);
        continue;
      }

      console.log(`✅ ${filePath} → ${domain}`);

      // Obtener el brain correspondiente
      const { data: brain, error: brainError } = await supabase
        .from('brains')
        .select('id')
        .eq('domain', domain)
        .single();

      if (brainError || !brain) {
        console.log(`⚠️  Brain de ${domain} no encontrado`);
        results.push({ file: filePath, status: 'brain_not_found', domain });
        continue;
      }

      // Obtener contenido del archivo desde GitHub
      const rawUrl = `https://raw.githubusercontent.com/${data.repository.name}/${data.ref}/${filePath}`;
      let content = '';

      try {
        const response = await fetch(rawUrl);
        content = await response.text();
      } catch (err) {
        console.error(`Error fetching ${filePath}:`, err);
        results.push({ file: filePath, status: 'fetch_failed', domain });
        continue;
      }

      // Agregar documento al brain
      const title = filePath.split('/').pop()?.replace('.md', '') || 'Documento';

      const { error: addError } = await supabase
        .from('brain_documents')
        .insert({
          brainId: brain.id,
          title,
          content,
          source: 'github',
          sourceUrl: `https://github.com/${data.repository.name}/blob/${data.ref}/${filePath}`,
          sourcePath: filePath,
        });

      if (addError) {
        console.error(`Error agregando documento ${filePath}:`, addError);
        results.push({ file: filePath, status: 'insert_failed', domain });
      } else {
        console.log(`✅ Documento agregado: ${title} → ${domain}`);
        results.push({ file: filePath, status: 'success', domain });
      }
    }

    // Respuesta
    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\n✅ Webhook completado: ${successCount}/${results.length} documentos agregados`);

    return NextResponse.json({
      success: true,
      message: `${successCount} documentos sincronizados`,
      details: results,
    });

  } catch (error) {
    console.error('❌ Error en webhook:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
