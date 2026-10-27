/**
 * 缓存出口。
 *
 * 说明：Next.js 的失效由 Server Action 里的 revalidateTag / revalidatePath 完成，
 * 这里保留一个显式占位，避免调用方直接碰 next/cache。
 */
export async function resetCacheUnsafe() {
  // Next.js cache invalidation is handled via revalidatePath in actions.
}
