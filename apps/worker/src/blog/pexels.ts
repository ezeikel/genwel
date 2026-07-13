// Pexels client for the worker blog pipeline. Ported from apps/web/lib/pexels/
// client.ts, with the Next-specific `next: { revalidate }` fetch option removed
// (this runs under plain Node fetch on the box, not the Next data cache).

const PEXELS_API_URL = 'https://api.pexels.com/v1';

function getPexelsApiKey(): string {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.warn('[Pexels] PEXELS_API_KEY not found in environment');
    return '';
  }
  return key;
}

export type PexelsPhoto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
};

export type PexelsSearchResponse = {
  photos: PexelsPhoto[];
  total_results: number;
  page: number;
  per_page: number;
};

export async function searchPhotos(
  query: string,
  options: {
    perPage?: number;
    page?: number;
    orientation?: 'landscape' | 'portrait' | 'square';
  } = {},
): Promise<PexelsSearchResponse> {
  const { perPage = 15, page = 1, orientation = 'landscape' } = options;

  const params = new URLSearchParams({
    query,
    per_page: perPage.toString(),
    page: page.toString(),
    orientation,
  });

  const apiKey = getPexelsApiKey();
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY is not configured');
  }

  const response = await fetch(`${PEXELS_API_URL}/search?${params}`, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  return response.json() as Promise<PexelsSearchResponse>;
}

export async function downloadPhoto(
  photo: PexelsPhoto,
  size: keyof PexelsPhoto['src'] = 'large',
): Promise<Buffer> {
  const response = await fetch(photo.src[size]);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export function formatPhotoCredit(photo: PexelsPhoto): {
  credit: string;
  creditUrl: string;
} {
  return {
    credit: photo.photographer,
    creditUrl: photo.photographer_url,
  };
}

// Fetch multiple candidate photos from Pexels for AI evaluation. Searches with
// each term and returns candidates for the vision judge, excluding already-used
// photo ids.
export async function fetchBlogPhotosForEvaluation(
  searchTerms: string[],
  options: {
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
    excludeIds?: string[];
  } = {},
): Promise<{
  photos: Array<{ photo: PexelsPhoto; searchTerm: string }>;
}> {
  const { orientation = 'landscape', excludeIds = [] } = options;
  const excludeSet = new Set(excludeIds);
  const allPhotos: Array<{ photo: PexelsPhoto; searchTerm: string }> = [];

  for (const term of searchTerms) {
    try {
      const response = await searchPhotos(term, {
        perPage: 5,
        orientation,
      });

      const availablePhotos = response.photos
        .filter((photo) => !excludeSet.has(String(photo.id)))
        .map((photo) => ({ photo, searchTerm: term }));

      allPhotos.push(...availablePhotos);

      if (allPhotos.length >= 10) break;
    } catch (error) {
      console.error(`Error searching Pexels for "${term}":`, error);
    }
  }

  return { photos: allPhotos };
}
