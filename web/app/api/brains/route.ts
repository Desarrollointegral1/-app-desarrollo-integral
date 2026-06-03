import { NextRequest, NextResponse } from 'next/server';
import { getBrainFactory } from '@/lib/brain-factory';
import type { BrainDomain } from '@/lib/brain-factory/types';

/**
 * GET /api/brains - Listar todos los brains
 */
export async function GET() {
  try {
    const factory = getBrainFactory();
    const brains = await factory.listBrains();

    return NextResponse.json({
      status: 'success',
      data: brains,
      count: brains.length,
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
 * POST /api/brains - Crear un nuevo brain
 * Body: { name, domain, description, config? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, domain, description, config } = body;

    // Validar inputs
    if (!name || !domain || !description) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields: name, domain, description' },
        { status: 400 }
      );
    }

    const validDomains: BrainDomain[] = ['nutrition', 'training', 'physiotherapy', 'development'];
    if (!validDomains.includes(domain)) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Invalid domain. Must be one of: ${validDomains.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const factory = getBrainFactory();
    const brain = await factory.createBrain(name, domain, description, config);

    return NextResponse.json(
      {
        status: 'success',
        message: `Brain "${name}" created successfully`,
        data: brain,
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
