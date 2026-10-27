/**
 * 生产环境的读失败策略。
 *
 * 公开内容读取在数据库异常时会 `catch` 后回落到本地快照；但本地快照可能不存在，
 * 此时 `readLocalDbSafe()` 会用 seed 生成一份——等于把种子里的示例文章当成真实内容发出去，
 * 还可能被搜索引擎收录。所以生产环境必须失败，而不是静默发错内容。
 */
export function rethrowInProduction(label: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") return;
  const detail = error instanceof Error ? error.message : String(error);
  throw new Error(`${label} read failed: ${detail}`);
}
