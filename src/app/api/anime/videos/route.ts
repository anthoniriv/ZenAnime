import { NextRequest, NextResponse } from 'next/server';
import { obtenerUrlVideo } from '@/lib/anime-service';
import { reconstruirUrlEpisodio } from '@/lib/slug-utils';

export async function POST(request: NextRequest) {
  let body: { slug?: string; fuente?: string; episodio?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { slug, fuente, episodio } = body;

  if (!slug || !fuente || episodio == null) {
    return NextResponse.json(
      { error: 'Se requieren "slug", "fuente" y "episodio" en el body' },
      { status: 400 }
    );
  }

  if (fuente !== 'jkanime' && fuente !== 'animeflv') {
    return NextResponse.json(
      { error: 'Fuente inválida. Debe ser "jkanime" o "animeflv"' },
      { status: 400 }
    );
  }

  const url = reconstruirUrlEpisodio(slug, episodio, fuente);

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
