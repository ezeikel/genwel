// Google Fonts URLs for Plus Jakarta Sans (v12)
const PLUS_JAKARTA_SANS_BOLD =
  'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_TknNSg.ttf';

const PLUS_JAKARTA_SANS_SEMIBOLD =
  'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_d0nNSg.ttf';

const PLUS_JAKARTA_SANS_REGULAR =
  'https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf';

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${url}`);
  }
  return response.arrayBuffer();
}

export async function loadPlusJakartaBold(): Promise<ArrayBuffer> {
  return fetchFont(PLUS_JAKARTA_SANS_BOLD);
}

export async function loadPlusJakartaSemiBold(): Promise<ArrayBuffer> {
  return fetchFont(PLUS_JAKARTA_SANS_SEMIBOLD);
}

export async function loadPlusJakartaRegular(): Promise<ArrayBuffer> {
  return fetchFont(PLUS_JAKARTA_SANS_REGULAR);
}

export async function loadOGFonts(): Promise<
  [ArrayBuffer, ArrayBuffer, ArrayBuffer]
> {
  return Promise.all([
    loadPlusJakartaBold(),
    loadPlusJakartaSemiBold(),
    loadPlusJakartaRegular(),
  ]);
}

export const OG_FONT_CONFIG = {
  plusJakarta: { name: 'Plus Jakarta Sans' },
} as const;
