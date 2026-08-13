/** Resolve a full thumbnail URL from an S3 key, or null when there is no key. */
export function buildThumbnailUrl(thumbnailS3Key: string | null): string | null {
  if (!thumbnailS3Key) return null
  return `${process.env.NEXT_PUBLIC_DOCUMENTS_CDN_BASE_URL ?? ''}/${thumbnailS3Key}`
}
