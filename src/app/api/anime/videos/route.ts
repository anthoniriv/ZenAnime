import { NextRequest, NextResponse } from 'next/server';
import { obtenerUrlVideo } from '@/lib/anime-service';

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
    const videos = await obtenerUrlVideo(url, fuente);
    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron videos disponibles' },
        { status: 404 }
      );
    }
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Error obteniendo videos:', error);
    return NextResponse.json(
      { error: 'Error al obtener videos' },
      { status: 500 }
    );
  }
}
