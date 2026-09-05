import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_DIRECTUS_URL = "http://127.0.0.1:8055";
const LOCAL_MEDIA_DIR = path.join("media", "servicios");
const LOCAL_MEDIA_URL_PREFIX = "/media/servicios";

/** Evita re-descargas si varias páginas llaman a fetchServicios en el mismo build. */
const assetDownloadCache = new Map<string, Promise<string | null>>();

export type Servicio = {
  id: number | string;
  titulo: string;
  descripcion: string;
  imagenUrl: string | null;
};

export type FaqItem = {
  id: number | string;
  pregunta: string;
  respuesta: string;
};

export type VideoItem = {
  id: number | string;
  titulo: string;
  descripcion: string;
  urlInstagram: string;
  permalink: string;
  embedUrl: string;
};

type DirectusListResponse<T> = {
  data: T[];
};

export function getDirectusUrl(): string {
  return (
    import.meta.env.PUBLIC_DIRECTUS_URL?.replace(/\/$/, "") ||
    DEFAULT_DIRECTUS_URL
  );
}

function extractAssetId(imagen: unknown): string | null {
  if (typeof imagen === "string") return imagen;

  if (
    imagen &&
    typeof imagen === "object" &&
    "id" in imagen &&
    typeof (imagen as { id: unknown }).id === "string"
  ) {
    return (imagen as { id: string }).id;
  }

  return null;
}

function extensionFromContentType(contentType: string | null): string {
  const mime = (contentType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";

  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    case "image/avif":
      return "avif";
    default:
      return "jpg";
  }
}

/**
 * Descarga un asset de Directus y lo escribe en public/ y dist/
 * para que el sitio estático (Netlify) no dependa de 127.0.0.1:8055.
 */
async function downloadAssetLocally(assetId: string): Promise<string | null> {
  const cached = assetDownloadCache.get(assetId);
  if (cached) return cached;

  const download = (async (): Promise<string | null> => {
    const remoteUrl = `${getDirectusUrl()}/assets/${assetId}`;

    try {
      const response = await fetch(remoteUrl);

      if (!response.ok) {
        console.error(
          `[directus] GET ${remoteUrl} → ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const ext = extensionFromContentType(response.headers.get("content-type"));
      const filename = `${assetId}.${ext}`;
      const buffer = Buffer.from(await response.arrayBuffer());

      const targets = [
        path.join(process.cwd(), "public", LOCAL_MEDIA_DIR, filename),
        path.join(process.cwd(), "dist", LOCAL_MEDIA_DIR, filename),
      ];

      await Promise.all(
        targets.map(async (filePath) => {
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, buffer);
        }),
      );

      return `${LOCAL_MEDIA_URL_PREFIX}/${filename}`;
    } catch (error) {
      console.error(`[directus] No se pudo descargar ${remoteUrl}`, error);
      return null;
    }
  })();

  assetDownloadCache.set(assetId, download);
  return download;
}

async function resolveImagenUrl(imagen: unknown): Promise<string | null> {
  const id = extractAssetId(imagen);
  if (!id) return null;

  // Build/preview estático: empaquetar en dist. Dev: Directus en vivo.
  if (import.meta.env.PROD) {
    return downloadAssetLocally(id);
  }

  return `${getDirectusUrl()}/assets/${id}`;
}

export async function fetchServicios(): Promise<Servicio[]> {
  const url = `${getDirectusUrl()}/items/servicios`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `[directus] GET ${url} → ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const payload = (await response.json()) as DirectusListResponse<
      Record<string, unknown> & { id: number | string }
    >;

    const servicios = await Promise.all(
      (payload.data ?? []).map(async (item) => {
        const titulo =
          typeof item.titulo === "string" ? item.titulo.trim() : "";
        const descripcion =
          typeof item.descripcion === "string" ? item.descripcion : "";

        return {
          id: item.id,
          titulo,
          descripcion,
          imagenUrl: await resolveImagenUrl(item.imagen),
        };
      }),
    );

    return servicios.filter((item) => item.titulo.length > 0);
  } catch (error) {
    console.error(`[directus] No se pudo leer ${url}`, error);
    return [];
  }
}

function pickString(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

export async function fetchFaq(): Promise<FaqItem[]> {
  const url = `${getDirectusUrl()}/items/faq`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `[directus] GET ${url} → ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const payload = (await response.json()) as DirectusListResponse<
      Record<string, unknown> & { id: number | string }
    >;

    return (payload.data ?? [])
      .map((item) => ({
        id: item.id,
        pregunta: pickString(item, ["pregunta", "question", "titulo", "title"]),
        respuesta: pickString(item, [
          "respuesta",
          "answer",
          "descripcion",
          "contenido",
          "content",
        ]),
      }))
      .filter((item) => item.pregunta.length > 0 && item.respuesta.length > 0);
  } catch (error) {
    console.error(`[directus] No se pudo leer ${url}`, error);
    return [];
  }
}

/**
 * Normaliza URLs de Instagram (post/reel/tv) a permalink limpio + URL de embed.
 */
export function parseInstagramUrl(raw: string): {
  permalink: string;
  embedUrl: string;
} | null {
  try {
    const parsed = new URL(raw.trim());
    if (!parsed.hostname.includes("instagram.com")) return null;

    const match = parsed.pathname.match(/\/(reel|p|tv)\/([^/?#]+)/i);
    if (!match) return null;

    const type = match[1].toLowerCase();
    const code = match[2];
    const permalink = `https://www.instagram.com/${type}/${code}/`;
    const embedUrl = `${permalink}embed`;

    return { permalink, embedUrl };
  } catch {
    return null;
  }
}

export async function fetchVideos(): Promise<VideoItem[]> {
  const url = `${getDirectusUrl()}/items/videos`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `[directus] GET ${url} → ${response.status} ${response.statusText}`,
      );
      return [];
    }

    const payload = (await response.json()) as DirectusListResponse<
      Record<string, unknown> & { id: number | string }
    >;

    return (payload.data ?? [])
      .map((item) => {
        const titulo = pickString(item, ["titulo", "title", "nombre"]);
        const descripcion = pickString(item, [
          "descripcion",
          "description",
          "texto",
        ]);
        const urlInstagram = pickString(item, [
          "url_instagram",
          "urlInstagram",
          "instagram",
          "url",
        ]);
        const parsed = urlInstagram ? parseInstagramUrl(urlInstagram) : null;

        if (!parsed) {
          return null;
        }

        return {
          id: item.id,
          titulo: titulo || "Vídeo del taller",
          descripcion,
          urlInstagram,
          permalink: parsed.permalink,
          embedUrl: parsed.embedUrl,
        };
      })
      .filter((item): item is VideoItem => item !== null);
  } catch (error) {
    console.error(`[directus] No se pudo leer ${url}`, error);
    return [];
  }
}
