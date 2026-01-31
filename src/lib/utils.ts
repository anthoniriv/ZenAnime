import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import dns from 'dns';
import https from 'https';
import zlib from 'zlib';

// Cache para DNS
const dnsCache = new Map<string, { ip: string; timestamp: number }>();
const DNS_CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Cache general
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hora

// Headers que simulan un navegador real
const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Upgrade-Insecure-Requests': '1',
};

export function normalizarNombreAnime(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function obtenerDeCache<T>(clave: string): T | null {
  const item = cache.get(clave);
  if (!item) return null;

  if (Date.now() - item.timestamp > CACHE_EXPIRATION) {
    cache.delete(clave);
    return null;
  }

  return item.data as T;
}

export function guardarEnCache<T>(clave: string, data: T): void {
  cache.set(clave, {
    data,
    timestamp: Date.now(),
  });
}

async function resolverDNS(hostname: string): Promise<string> {
  const cached = dnsCache.get(hostname);
  if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL) {
    return cached.ip;
  }

  return new Promise((resolve, reject) => {
    const resolver = new dns.Resolver();
    resolver.setServers(['8.8.8.8', '8.8.4.4']);

    resolver.resolve4(hostname, (err, addresses) => {
      if (err) {
        reject(err);
      } else {
        const ip = addresses[0];
        dnsCache.set(hostname, { ip, timestamp: Date.now() });
        resolve(ip);
      }
    });
  });
}

// Hacer petición HTTP raw usando https.request para control total
function hacerPeticionHTTPS(
  url: string,
  ip: string,
  headers: Record<string, string>,
  redirectCount = 0
): Promise<string> {
  if (redirectCount > 5) {
    return Promise.reject(new Error('Too many redirects'));
  }

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options: https.RequestOptions = {
      hostname: ip,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        ...headers,
        Host: urlObj.hostname,
      },
      rejectUnauthorized: false,
      servername: urlObj.hostname,
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];

      // Manejar redirects
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          const fullRedirectUrl = redirectUrl.startsWith('http')
            ? redirectUrl
            : `https://${urlObj.hostname}${redirectUrl}`;
          resolve(hacerPeticionHTTPS(fullRedirectUrl, ip, headers, redirectCount + 1));
          return;
        }
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];

        // Descomprimir si es necesario
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded.toString('utf8'));
            }
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) {
              reject(err);
            } else {
              resolve(decoded.toString('utf8'));
            }
          });
        } else {
          resolve(buffer.toString('utf8'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

export async function fetchConDNSPersonalizado(
  url: string,
  options: AxiosRequestConfig = {}
): Promise<AxiosResponse> {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;

  // Resolver DNS usando Google DNS
  let ip: string;
  try {
    ip = await resolverDNS(hostname);
    console.log(`   ✅ DNS: ${hostname} -> ${ip}`);
  } catch (dnsError) {
    console.log(`   ⚠️ DNS falló para ${hostname}, intentando con axios directo`);
    // Si falla DNS, intentar con axios directamente
    return await axios.get(url, {
      headers: {
        ...BROWSER_HEADERS,
        ...options.headers,
      },
      timeout: 25000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
  }

  // Usar petición raw para control total sobre DNS
  try {
    const headers: Record<string, string> = {
      ...BROWSER_HEADERS,
      Referer: `https://${hostname}/`,
      ...((options.headers as Record<string, string>) || {}),
    };

    const data = await hacerPeticionHTTPS(url, ip, headers);

    // Retornar en formato compatible con axios
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as AxiosRequestConfig,
    } as AxiosResponse;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`   ❌ Error con petición raw (${errorMessage}), intentando axios`);

    // Fallback a axios
    return await axios.get(url, {
      headers: {
        ...BROWSER_HEADERS,
        ...options.headers,
      },
      timeout: 25000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
  }
}

// Limpiar cache expirado cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const ahora = Date.now();
    for (const [clave, item] of cache.entries()) {
      if (ahora - item.timestamp > CACHE_EXPIRATION) {
        cache.delete(clave);
      }
    }
  }, 60 * 60 * 1000);
}
