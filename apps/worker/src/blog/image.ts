import { models } from '@genwel/banking/models';
import { experimental_generateImage as generateImage } from 'ai';
import { findBestImage, type ImageEvaluation } from './image-evaluation.js';
import {
  downloadPhoto,
  fetchBlogPhotosForEvaluation,
  formatPhotoCredit,
  type PexelsPhoto,
} from './pexels.js';
import { BLOG_IMAGE_GENERATION_PROMPT } from './prompts.js';
import { writeClient } from './sanity.js';
import { generateAltText, getCombinedSearchTerms } from './search-terms.js';

// Blog featured image (ported from the in-web pipeline, apps/web/app/actions/
// blog.ts + the feat/blog-images image step):
//   category/topic search terms → Pexels candidates → vision judge (findBest)
//   → use it only above the confidence threshold, else generate with gpt-image-2
//   (high) → upload the bytes into Sanity as an asset and return the featured
//   image ref. On any failure the caller ships the post with no image rather
//   than blocking publication.

export type FeaturedImage = {
  asset: { _type: 'reference'; _ref: string };
  alt: string;
  credit?: string;
  creditUrl?: string;
  pexelsPhotoId?: string;
};

// Minimum confidence score for the vision judge to approve a Pexels image.
const IMAGE_EVALUATION_THRESHOLD = 60;

// Get search terms + alt text using the pre-defined mappings (no AI call).
function getImageSearchTerms(
  title: string,
  category: string,
): { searchTerms: string[]; altText: string } {
  const searchTerms = getCombinedSearchTerms(category, title);
  const altText = generateAltText(searchTerms[0] || 'finance', { title });
  return { searchTerms, altText };
}

// Upload image bytes to Sanity and return the asset reference.
async function uploadImageToSanity(
  buffer: Buffer,
  filename: string,
): Promise<{ _type: 'reference'; _ref: string }> {
  const asset = await writeClient.assets.upload('image', buffer, {
    filename,
  });
  return { _type: 'reference', _ref: asset._id };
}

// gpt-image-2 (quality 'high', landscape) fallback when no Pexels photo clears
// the judge. Returns null on failure so the caller degrades gracefully.
async function generateImageWithOpenAI(
  title: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const prompt = BLOG_IMAGE_GENERATION_PROMPT.replace('{{TITLE}}', title);

  try {
    const { image } = await generateImage({
      model: models.blogImage,
      prompt: `Generate a high-quality professional photograph for this blog post. Do not include any text in the image. ${prompt}`,
      // Landscape hero (3:2). gpt-image-2 supports 1024x1024 / 1024x1536 / 1536x1024.
      size: '1536x1024',
      providerOptions: {
        openai: {
          quality: 'high',
          moderation: 'auto',
        },
      },
    });

    return {
      buffer: Buffer.from(image.uint8Array),
      mimeType: image.mediaType || 'image/png',
    };
  } catch (error) {
    console.error('[blog-image] gpt-image-2 generation failed:', error);
    return null;
  }
}

// Produce the post's featured image: Pexels + vision judge → gpt-image-2
// fallback → Sanity asset. Returns null (no image) on total failure — never
// throws.
export async function getFeaturedImage(
  title: string,
  excerpt: string,
  category: string,
  slug: string,
  excludeIds: string[] = [],
): Promise<FeaturedImage | null> {
  try {
    // 1. Search terms (no AI call needed).
    const { searchTerms, altText } = getImageSearchTerms(title, category);

    // 2. Fetch candidate photos from Pexels (excluding already-used ids).
    const pexelsResult = await fetchBlogPhotosForEvaluation(searchTerms, {
      orientation: 'landscape',
      excludeIds,
    });

    let selectedPhoto: PexelsPhoto | null = null;
    let evaluationResult: ImageEvaluation | null = null;

    if (pexelsResult.photos.length > 0) {
      // 3. Evaluate photos with the vision judge.
      try {
        const { selectedIndex, evaluations } = await findBestImage(
          pexelsResult.photos.map((p) => ({
            url: p.photo.src.large,
            searchTerm: p.searchTerm,
          })),
          { title, excerpt, category },
          IMAGE_EVALUATION_THRESHOLD,
        );

        if (selectedIndex !== null) {
          selectedPhoto = pexelsResult.photos[selectedIndex].photo;
          evaluationResult = evaluations[selectedIndex];
          console.log(
            `[blog-image] judge selected Pexels photo ${selectedPhoto.id} (confidence ${evaluationResult.confidence})`,
          );
        } else {
          console.log('[blog-image] judge rejected all Pexels candidates');
        }
      } catch (evalError) {
        // If evaluation fails, fall back to the first Pexels photo.
        console.warn(
          '[blog-image] judge failed, using first Pexels photo:',
          evalError,
        );
        selectedPhoto = pexelsResult.photos[0].photo;
      }
    }

    // 4. Use the selected Pexels photo if we have one.
    if (selectedPhoto) {
      const buffer = await downloadPhoto(selectedPhoto, 'large2x');
      const assetRef = await uploadImageToSanity(
        buffer,
        `${slug}-featured.jpg`,
      );
      const credit = formatPhotoCredit(selectedPhoto);

      return {
        asset: assetRef,
        alt: altText,
        credit: credit.credit,
        creditUrl: credit.creditUrl,
        pexelsPhotoId: String(selectedPhoto.id),
      };
    }

    // 5. gpt-image-2 high fallback.
    console.log('[blog-image] no Pexels match, generating with gpt-image-2');
    const generatedResult = await generateImageWithOpenAI(title);

    if (generatedResult) {
      const assetRef = await uploadImageToSanity(
        generatedResult.buffer,
        `${slug}-featured-generated.png`,
      );
      return {
        asset: assetRef,
        alt: altText,
        credit: 'Generated with AI',
      };
    }

    console.warn('[blog-image] no image produced; publishing without one');
    return null;
  } catch (error) {
    console.error('[blog-image] failed, publishing without image:', error);
    return null;
  }
}
