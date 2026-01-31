import * as cheerio from 'cheerio';
import {
  fetchConDNSPersonalizado,
  normalizarNombreAnime,
  obtenerDeCache,
  guardarEnCache,
} from './utils';
import { buscarAnimeListaJikan } from './jikan-api';
import type { AnimeResult, AnimeDetails, VideoSource, Episode } from '@/types/anime';

/** Filtra resultados que no tienen relación con la búsqueda */
function esRelevante(
  tituloResultado: string,
  queryNormalizado: string,
  titulosJikan: string[]
): boolean {
  const tituloNorm = normalizarNombreAnime(tituloResultado);
  const palabrasQuery = queryNormalizado.split(/\s+/).filter((p) => p.length >= 2);

  // Al menos una palabra de la búsqueda debe aparecer en el título
  for (const palabra of palabrasQuery) {
    if (tituloNorm.includes(palabra)) return true;
  }

  // O coincide con títulos de Jikan (ej: "jujusu" -> Jikan devuelve "Jujutsu Kaisen")
  for (const ref of titulosJikan) {
    const refNorm = normalizarNombreAnime(ref);
    if (tituloNorm.includes(refNorm) || refNorm.includes(tituloNorm)) return true;
    const palabrasRef = refNorm.split(/\s+/).filter((p) => p.length >= 3);
    if (palabrasRef.some((p) => tituloNorm.includes(p))) return true;
  }

  return false;
}

async function buscarAnimeJKanime(nombreAnime: string): Promise<AnimeResult[]> {
  try {
    const nombreNormalizado = normalizarNombreAnime(nombreAnime);
    const url = `https://jkanime.net/buscar/${encodeURIComponent(nombreNormalizado)}`;

    const response = await fetchConDNSPersonalizado(url);
    const $ = cheerio.load(response.data);
    const resultados: AnimeResult[] = [];

    $('.anime__item').each((i, elem) => {
      if (i < 10) {
        const titulo =
          $(elem).find('.anime__item__text h5 a').text().trim() ||
          $(elem).find('h5 a').text().trim() ||
          $(elem).find('a').first().attr('title') ||
          $(elem).find('a').first().text().trim();
        const link = $(elem).find('a').first().attr('href');
        const imagen =
          $(elem).find('.anime__item__pic').attr('data-setbg') ||
          $(elem).find('img').first().attr('src');

        if (titulo && link && !link.includes('/buscar/')) {
          const urlCompleta = link.startsWith('http')
            ? link
            : `https://jkanime.net${link}`;
          resultados.push({
            titulo,
            url: urlCompleta,
            imagen,
            fuente: 'jkanime',
          });
        }
      }
    });

    return resultados;
  } catch (error) {
    console.error('Error buscando en JKanime:', error);
    return [];
  }
}

async function buscarAnimeFlv(nombreAnime: string): Promise<AnimeResult[]> {
  try {
    const nombreNormalizado = normalizarNombreAnime(nombreAnime);
    const url = `https://www3.animeflv.net/browse?q=${encodeURIComponent(nombreNormalizado)}`;

    const response = await fetchConDNSPersonalizado(url);
    const $ = cheerio.load(response.data);
    const resultados: AnimeResult[] = [];

    $('.ListAnimes li').each((i, elem) => {
      if (i < 10) {
        const titulo =
          $(elem).find('h3.Title').text().trim() ||
          $(elem).find('.Title strong').text().trim() ||
          $(elem).find('a').first().attr('title') ||
          $(elem).find('a h3').text().trim();
        const link = $(elem).find('a').first().attr('href');
        const imagen =
          $(elem).find('figure img').attr('src') ||
          $(elem).find('img').first().attr('src');

        if (titulo && link && link.includes('/anime/')) {
          const urlCompleta = link.startsWith('http')
            ? link
            : `https://www3.animeflv.net${link}`;
          resultados.push({
            titulo,
            url: urlCompleta,
            imagen,
            fuente: 'animeflv',
          });
        }
      }
    });

    return resultados;
  } catch (error) {
    console.error('Error buscando en AnimeFLV:', error);
    return [];
  }
}

export async function buscarAnime(nombreAnime: string): Promise<AnimeResult[]> {
  const queryNorm = normalizarNombreAnime(nombreAnime);
  const cacheKey = `anime:${queryNorm}`;
  const cached = obtenerDeCache<AnimeResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Buscar en Jikan primero para obtener títulos de referencia (mejor manejo de typos)
  const jikanAnimes = await buscarAnimeListaJikan(nombreAnime);
  const titulosJikan = jikanAnimes.map((a) => a.title).concat(
    jikanAnimes.map((a) => a.title_english).filter(Boolean) as string[]
  );

  // Buscar en jkanime y animeflv (también con títulos de Jikan si hay typos)
  const queriesBusqueda = [nombreAnime];
  if (titulosJikan.length > 0 && normalizarNombreAnime(titulosJikan[0]) !== queryNorm) {
    queriesBusqueda.push(titulosJikan[0]);
  }

  const resultadosJK: AnimeResult[] = [];
  const resultadosFlv: AnimeResult[] = [];
  for (const q of queriesBusqueda) {
    const [jk, flv] = await Promise.all([
      buscarAnimeJKanime(q),
      buscarAnimeFlv(q),
    ]);
    resultadosJK.push(...jk);
    resultadosFlv.push(...flv);
  }

  const todosResultados = [...resultadosJK, ...resultadosFlv];
  const unicos: AnimeResult[] = [];
  const vistos = new Set<string>();

  for (const resultado of todosResultados) {
    const clave = normalizarNombreAnime(resultado.titulo);
    if (!vistos.has(clave) && esRelevante(resultado.titulo, queryNorm, titulosJikan)) {
      vistos.add(clave);
      unicos.push(resultado);
    }
  }

  const resultadosFinales = unicos.slice(0, 10);

  if (resultadosFinales.length > 0) {
    guardarEnCache(cacheKey, resultadosFinales);
  }

  return resultadosFinales;
}

// Función auxiliar para extraer episodios de JKanime
function extraerEpisodiosJKanime($: cheerio.CheerioAPI, slug: string): Episode[] {
  const episodios: Episode[] = [];
  const episodiosSet = new Set<number>();

  // Método 1: Buscar "Episodios: X" en la información
  const episodiosText = $('li:contains("Episodios:")').text();
  const totalMatch = episodiosText.match(/Episodios:\s*(\d+)/);
  if (totalMatch) {
    const total = parseInt(totalMatch[1]);
    for (let i = 1; i <= total; i++) {
      if (!episodiosSet.has(i)) {
        episodiosSet.add(i);
        episodios.push({
          numero: `Capítulo ${i}`,
          url: `https://jkanime.net/${slug}/${i}/`,
        });
      }
    }
  }

  // Método 2: Buscar en los scripts "var episodes = [...]" o similar
  const scriptContent = $('script')
    .map((_, el) => $(el).html())
    .get()
    .join('\n');

  // Buscar patrones como: episodes = [1, 2, 3, ...]
  const episodesArrayMatch = scriptContent.match(/episodes?\s*=\s*\[([^\]]+)\]/i);
  if (episodesArrayMatch) {
    const nums = episodesArrayMatch[1].match(/\d+/g);
    if (nums) {
      nums.forEach(n => {
        const num = parseInt(n);
        if (!episodiosSet.has(num)) {
          episodiosSet.add(num);
          episodios.push({
            numero: `Capítulo ${num}`,
            url: `https://jkanime.net/${slug}/${num}/`,
          });
        }
      });
    }
  }

  // Método 3: Buscar enlaces directos a capítulos en la página
  $('a[href*="/' + slug + '/"]').each((_, elem) => {
    const href = $(elem).attr('href') || '';
    const capMatch = href.match(new RegExp(`/${slug}/(\\d+)/?`));
    if (capMatch) {
      const num = parseInt(capMatch[1]);
      if (!episodiosSet.has(num) && num > 0) {
        episodiosSet.add(num);
        episodios.push({
          numero: `Capítulo ${num}`,
          url: `https://jkanime.net/${slug}/${num}/`,
        });
      }
    }
  });

  // Método 4: Buscar en paginación "Ep X - Y" y botones de capítulos
  const paginationText = $('select option, .pagination-eps').text();
  const rangeMatch = paginationText.match(/(\d+)\s*-\s*(\d+)/g);
  if (rangeMatch) {
    rangeMatch.forEach(range => {
      const [start, end] = range.split('-').map(n => parseInt(n.trim()));
      for (let i = start; i <= end; i++) {
        if (!episodiosSet.has(i)) {
          episodiosSet.add(i);
          episodios.push({
            numero: `Capítulo ${i}`,
            url: `https://jkanime.net/${slug}/${i}/`,
          });
        }
      }
    });
  }

  // Método 5: Buscar "Último episodio: X"
  const ultimoEpMatch = $('body').text().match(/[Úú]ltimo\s+episodio[:\s]+[^-]*-\s*(\d+)/i);
  if (ultimoEpMatch) {
    const ultimo = parseInt(ultimoEpMatch[1]);
    for (let i = 1; i <= ultimo; i++) {
      if (!episodiosSet.has(i)) {
        episodiosSet.add(i);
        episodios.push({
          numero: `Capítulo ${i}`,
          url: `https://jkanime.net/${slug}/${i}/`,
        });
      }
    }
  }

  // Método 6: Buscar botones con clase que contenga "capitulo" o "episode"
  $('[class*="capitulo"], [class*="episode"], [class*="ep-"]').each((_, elem) => {
    const text = $(elem).text();
    const numMatch = text.match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      if (!episodiosSet.has(num) && num > 0 && num < 5000) {
        episodiosSet.add(num);
        episodios.push({
          numero: `Capítulo ${num}`,
          url: `https://jkanime.net/${slug}/${num}/`,
        });
      }
    }
  });

  // Ordenar episodios
  return episodios.sort((a, b) => {
    const numA = parseInt(a.numero.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.numero.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });
}

export async function obtenerDetallesAnime(
  url: string,
  fuente: 'jkanime' | 'animeflv'
): Promise<AnimeDetails | null> {
  try {
    let urlFinal = url;
    if (fuente === 'animeflv' && url.includes('animeflv.net') && !url.includes('www3')) {
      urlFinal = url.replace('animeflv.net', 'www3.animeflv.net');
    }

    const response = await fetchConDNSPersonalizado(urlFinal);
    const $ = cheerio.load(response.data);

    const detalles: AnimeDetails = {
      titulo: '',
      temporadas: [],
      totalCapitulos: 0,
      fuente,
      slug: '',
      imagen: undefined,
      sinopsis: undefined,
    };

    if (fuente === 'jkanime') {
      detalles.titulo =
        $('h1').first().text().trim() ||
        $('title').text().replace(/ — JkAnime.*$/, '').trim() ||
        $('title').text().replace(/ - anime.*$/i, '').trim();

      const slugMatch = url.match(/jkanime\.net\/([^\/]+)/);
      detalles.slug = slugMatch ? slugMatch[1] : '';

      // Múltiples selectores para imagen
      detalles.imagen =
        $('.anime__details__pic').attr('data-setbg') ||
        $('.set-bg').attr('data-setbg') ||
        $('img.anime-img').attr('src') ||
        $('figure img').first().attr('src') ||
        $('img[alt*="' + detalles.slug + '"]').first().attr('src');

      detalles.sinopsis =
        $('.sinopsis').text().trim() ||
        $('.anime__details__text p').text().trim() ||
        $('p.sinopsis').text().trim() ||
        $('[class*="description"]').text().trim();

      // Usar la función mejorada de extracción
      if (detalles.slug) {
        detalles.temporadas[0] = extraerEpisodiosJKanime($, detalles.slug);
      }
    } else if (fuente === 'animeflv') {
      detalles.titulo =
        $('h1.Title').text().trim() ||
        $('h2.Title').text().trim() ||
        $('title').text().replace(/ - AnimeFLV.*$/, '').trim();

      const slugMatch = url.match(/\/anime\/([^\/]+)/);
      detalles.slug = slugMatch ? slugMatch[1] : '';

      detalles.imagen = $('.AnimeCover img').attr('src') ||
        $('figure img').first().attr('src');

      detalles.sinopsis = $('.Description p').text().trim();

      const scriptContent = $('script')
        .map((_, el) => $(el).html())
        .get()
        .join('\n');

      // Regex más flexible para episodios de AnimeFLV
      const episodesMatch = scriptContent.match(
        /var\s+episodes\s*=\s*(\[[\s\S]*?\]);/
      );

      if (episodesMatch) {
        try {
          const episodes = JSON.parse(episodesMatch[1]) as number[][];
          detalles.temporadas[0] = episodes
            .map((ep) => ({
              numero: `Episodio ${ep[0]}`,
              url: `https://www3.animeflv.net/ver/${detalles.slug}-${ep[0]}`,
            }))
            .sort((a, b) => {
              const numA = parseInt(a.numero.match(/\d+/)?.[0] || '0');
              const numB = parseInt(b.numero.match(/\d+/)?.[0] || '0');
              return numA - numB;
            });
        } catch (e) {
          console.error('Error parseando episodios:', e);
        }
      }
    }

    detalles.totalCapitulos = detalles.temporadas[0]?.length || 0;
    return detalles;
  } catch (error) {
    console.error('Error obteniendo detalles:', error);
    return null;
  }
}

export async function obtenerUrlVideo(
  urlCapitulo: string,
  fuente: 'jkanime' | 'animeflv'
): Promise<VideoSource[]> {
  try {
    const response = await fetchConDNSPersonalizado(urlCapitulo, {
      headers: { Referer: urlCapitulo },
    });
    const $ = cheerio.load(response.data);
    const videos: VideoSource[] = [];

    if (fuente === 'animeflv') {
      const scriptContent = $('script')
        .map((_, el) => $(el).html())
        .get()
        .join('\n');
      const videosMatch = scriptContent.match(/var videos\s*=\s*(\{[\s\S]*?\});/);

      if (videosMatch) {
        try {
          const videosData = JSON.parse(videosMatch[1]) as {
            SUB?: { title?: string; server?: string; code: string }[];
            LAT?: { title?: string; server?: string; code: string }[];
          };
          const sources = videosData.SUB || videosData.LAT || [];

          for (const video of sources) {
            if (video.code) {
              videos.push({
                servidor: video.title || video.server || 'Servidor',
                url: video.code.startsWith('//')
                  ? `https:${video.code}`
                  : video.code,
                tipo: 'embed',
              });
            }
          }
        } catch (e) {
          console.error('Error parseando videos:', e);
        }
      }
    } else if (fuente === 'jkanime') {
      const scriptContent = $('script')
        .map((_, el) => $(el).html())
        .get()
        .join('\n');

      const videoMatches = scriptContent.matchAll(
        /video\[(\d+)\]\s*=\s*'(<iframe[^']+)'/g
      );
      const servidorNombres = [
        'Desu',
        'Maru',
        'Netu',
        'Okru',
        'Fembed',
        'Stream',
        'Server',
      ];

      for (const match of videoMatches) {
        const index = parseInt(match[1]);
        const iframeHtml = match[2];
        const srcMatch = iframeHtml.match(/src="([^"]+)"/);

        if (srcMatch) {
          let src = srcMatch[1].replace(/&amp;/g, '&');
          videos.push({
            servidor: servidorNombres[index] || `Server ${index + 1}`,
            url: src.startsWith('//') ? `https:${src}` : src,
            tipo: 'embed',
          });
        }
      }

      const serverButtons: string[] = [];
      $('.bg-servers a.servers, a.servers.btn-show').each((_, elem) => {
        const nombre = $(elem).text().trim();
        const dataId = $(elem).attr('data-id');
        if (nombre && dataId !== undefined) {
          serverButtons[parseInt(dataId)] = nombre;
        }
      });

      serverButtons.forEach((nombre, index) => {
        if (videos[index] && nombre) {
          videos[index].servidor = nombre;
        }
      });

      $('iframe.player_conte, iframe[src*="jkanime"], iframe[src*="stream"]').each((_, elem) => {
        const src = $(elem).attr('src');
        if (src && !videos.some((v) => v.url === src)) {
          videos.push({
            servidor: 'Principal',
            url: src.startsWith('//')
              ? `https:${src}`
              : src.replace(/&amp;/g, '&'),
            tipo: 'embed',
          });
        }
      });
    }

    // Buscar enlaces directos MP4/M3U8
    const scriptContent = $('script')
      .map((_, el) => $(el).html())
      .get()
      .join('\n');
    const mp4Matches = scriptContent.matchAll(
      /(https?:\/\/[^\s"']+\.(?:mp4|m3u8))/gi
    );

    for (const match of mp4Matches) {
      if (!videos.some((v) => v.url === match[1])) {
        videos.push({
          servidor: 'Directo',
          url: match[1],
          tipo: 'directo',
        });
      }
    }

    return videos;
  } catch (error) {
    console.error('Error obteniendo videos:', error);
    return [];
  }
}
