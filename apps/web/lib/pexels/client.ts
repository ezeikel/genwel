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
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  return response.json();
}

export async function getPhoto(id: number): Promise<PexelsPhoto> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) {
    throw new Error('PEXELS_API_KEY is not configured');
  }

  const response = await fetch(`${PEXELS_API_URL}/photos/${id}`, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Pexels API error: ${response.status}`);
  }

  return response.json();
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

/**
 * Fetch multiple photos from Pexels for AI evaluation
 *
 * Searches using multiple search terms and returns candidate photos
 * for the AI vision model to evaluate.
 */
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

  // Search with each term
  for (const term of searchTerms) {
    try {
      const response = await searchPhotos(term, {
        perPage: 5,
        orientation,
      });

      // Filter out already-used photos and add to results
      const availablePhotos = response.photos
        .filter((photo) => !excludeSet.has(String(photo.id)))
        .map((photo) => ({ photo, searchTerm: term }));

      allPhotos.push(...availablePhotos);

      // Stop if we have enough candidates
      if (allPhotos.length >= 10) break;
    } catch (error) {
      console.error(`Error searching Pexels for "${term}":`, error);
    }
  }

  return { photos: allPhotos };
}

/**
 * Fetch a single best photo from Pexels (legacy function for backwards compatibility)
 */
export async function fetchBlogPhoto(
  searchTerms: string[],
  options: {
    orientation?: 'landscape' | 'portrait' | 'square';
    size?: 'large' | 'medium' | 'small';
  } = {},
): Promise<{
  photo: PexelsPhoto | null;
  searchTerm: string;
}> {
  const { orientation = 'landscape' } = options;

  for (const term of searchTerms) {
    try {
      const response = await searchPhotos(term, {
        perPage: 5,
        orientation,
      });

      if (response.photos.length > 0) {
        // Pick a random photo from results
        const photo =
          response.photos[Math.floor(Math.random() * response.photos.length)];
        return { photo, searchTerm: term };
      }
    } catch (error) {
      console.error(`Error searching Pexels for "${term}":`, error);
    }
  }

  return { photo: null, searchTerm: '' };
}
