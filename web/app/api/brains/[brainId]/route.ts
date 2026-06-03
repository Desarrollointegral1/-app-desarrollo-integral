import { NextRequest, NextResponse } from 'next/server';
import { getBrainFactory } from '@/lib/brain-factory';

/**
 * GET /api/brains/[brainId] - Obtener un brain específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { brainId: string } }
) {
  try {
    const factory = getBrainFactory();
    const brain = await factory.getBrain(params.brainId);

    if (!brain) {
      return NextResponse.json(
        { status: 'error', message: 'Brain not found' },
        { status: 404 }
      );
    }

    // Obtener métricas
    const metrics = await factory.getBrainMetrics(params.brainId);

    return NextResponse.json({
      status: 'success',
      data: {
        brain,
        metrics,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brains/[brainId]/add-document - Agregar documento a un brain
 * Body: { title, content, source, sourceUrl? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { brainId: string } }
) {
  try {
    const body = await request.json();
    const { title, content, source, sourceUrl } = body;

    if (!title || !content || !source) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: title, content, source' },
        { status: 400 }
      );
    }

    const factory = getBrainFactory();

    // Validar que el brain existe
    const brain = await factory.getBrain(params.brainId);
    if (!brain) {
      return NextResponse.json(
        { status: 'error', message: 'Brain not found' },
        { status: 404 }
      );
    }

    // Agregar documento
    const document = await factory.addDocument(
      params.brainId,
      title,
      content,
      source,
      sourceUrl
    );

    return NextResponse.json(
      {
        status: 'success',
        message: 'Document added successfully',
        data: document,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
