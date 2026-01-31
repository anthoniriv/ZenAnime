import { NextRequest, NextResponse } from 'next/server';
import { obtenerDetallesAnime } from '@/lib/anime-service';
import { reconstruirUrlAnime } from '@/lib/slug-utils';

export async function POST(request: NextRequest) {
  let body: { slug?: string; fuente?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const { slug, fuente } = body;

  if (!slug || !fuente) {
    return NextResponse.json(
      { error: 'Se requieren "slug" y "fuente" en el body' },
      { status: 400 }
    );
  }

  if (fuente !== 'jkanime' && fuente !== 'animeflv') {
    return NextResponse.json(
      { error: 'Fuente inválida. Debe ser "jkanime" o "animeflv"' },
      { status: 400 }
    );
  }

  const url = reconstruirUrlAnime(slug, fuente);

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
