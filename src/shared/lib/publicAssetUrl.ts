export function getPublicAssetUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${baseUrl}${path.replace(/^\/+/, "")}`;
}

export function getImageUrl(path: string): string {
  return getPublicAssetUrl(`images/${path.replace(/^\/+/, "")}`);
}

export function getEventImageUrl(path: string): string {
  return getImageUrl(`events/${path.replace(/^\/+/, "")}`);
}
