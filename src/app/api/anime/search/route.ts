import { NextRequest, NextResponse } from 'next/server';
import { buscarAnime } from '@/lib/anime-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: 'Se requiere el parámetro de búsqueda "q"' },
      { status: 400 }
    );
  }

  try {
    const resultados = await buscarAnime(query);
    return NextResponse.json({ resultados });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    return NextResponse.json(
      { error: 'Error al buscar anime' },
      { status: 500 }
    );
  }
}
