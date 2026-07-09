const SUPABASE_PUBLIC_OBJECT_SEGMENT = "/storage/v1/object/public/";
const SUPABASE_PUBLIC_RENDER_SEGMENT = "/storage/v1/render/image/public/";

type ImageOptimizationOptions = {
  width?: number;
  quality?: number;
};

export function getOptimizedStorageImageUrl(
  imageUrl?: string,
  { width = 900, quality = 75 }: ImageOptimizationOptions = {}
) {
  if (!imageUrl || !imageUrl.includes(SUPABASE_PUBLIC_OBJECT_SEGMENT)) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    url.pathname = url.pathname.replace(SUPABASE_PUBLIC_OBJECT_SEGMENT, SUPABASE_PUBLIC_RENDER_SEGMENT);
    url.searchParams.set("width", String(width));
    url.searchParams.set("quality", String(quality));
    url.searchParams.set("resize", "contain");
    return url.toString();
  } catch {
    return imageUrl;
  }
}
