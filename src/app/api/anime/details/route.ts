import { NextRequest, NextResponse } from 'next/server';
import { obtenerDetallesAnime } from '@/lib/anime-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const fuente = searchParams.get('fuente') as 'jkanime' | 'animeflv';

  if (!url || !fuente) {
    return NextResponse.json(
      { error: 'Se requieren los parámetros "url" y "fuente"' },
      { status: 400 }
    );
  }

  if (fuente !== 'jkanime' && fuente !== 'animeflv') {
    return NextResponse.json(
      { error: 'Fuente inválida. Debe ser "jkanime" o "animeflv"' },
      { status: 400 }
    );
  }

  try {
    const detalles = await obtenerDetallesAnime(url, fuente);
    if (!detalles) {
      return NextResponse.json(
        { error: 'No se encontraron detalles del anime' },
        { status: 404 }
      );
    }
    return NextResponse.json({ detalles });
  } catch (error) {
    console.error('Error obteniendo detalles:', error);
    return NextResponse.json(
      { error: 'Error al obtener detalles del anime' },
      { status: 500 }
    );
  }
}
