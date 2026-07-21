import { NextRequest, NextResponse } from 'next/server';
import { getBrainFactory } from '@/lib/brain-factory';
import { requireApiKey } from '@/lib/api-auth';

/**
 * POST /api/brains/[brainId]/query - Consultar un brain
 * Body: { question }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brainId: string }> }
) {
  const denied = requireApiKey(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { question } = body;

    if (!question) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required field: question' },
        { status: 400 }
      );
    }

    const factory = getBrainFactory();
    const resolvedParams = await params;

    // Validar que el brain existe
    const brain = await factory.getBrain(resolvedParams.brainId);
    if (!brain) {
      return NextResponse.json(
        { status: 'error', message: 'Brain not found' },
        { status: 404 }
      );
    }

    // Procesar la query
    const query = await factory.queryBrain(resolvedParams.brainId, question);

    return NextResponse.json({
      status: 'success',
      message: 'Query processed successfully',
      data: query,
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
