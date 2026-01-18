import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { client } from './client';

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export function getOgImageUrl(source: SanityImageSource): string {
  return urlFor(source).width(1200).height(630).fit('crop').url();
}

export function getThumbnailUrl(source: SanityImageSource): string {
  return urlFor(source).width(400).height(300).fit('crop').url();
}

export function getFeaturedImageUrl(source: SanityImageSource): string {
  return urlFor(source).width(1200).height(800).fit('crop').url();
}
