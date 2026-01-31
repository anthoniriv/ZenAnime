import { NextRequest, NextResponse } from 'next/server';
import { buscarAnimeEnJikan } from '@/lib/jikan-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const titulo = searchParams.get('titulo');

  if (!titulo) {
    return NextResponse.json(
      { error: 'Se requiere el parámetro "titulo"' },
      { status: 400 }
    );
  }

  try {
    const info = await buscarAnimeEnJikan(titulo);
    return NextResponse.json({ info });
  } catch (error) {
    console.error('Error obteniendo info:', error);
    return NextResponse.json(
      { error: 'Error al obtener información del anime' },
      { status: 500 }
    );
  }
}
