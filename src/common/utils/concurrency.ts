/**
 * Chạy một mảng promise factories theo batch với concurrency limit.
 * Mỗi batch chạy song song tối đa `limit` tasks, batch tiếp theo
 * chỉ bắt đầu khi batch trước hoàn thành.
 */
export async function batchExecute<T>(
  factories: (() => Promise<T>)[],
  limit: number = 10,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  while (index < factories.length) {
    const batch = factories.slice(index, index + limit).map((fn) => fn());
    index += limit;
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Sleep utility — dùng để throttle giữa các request.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
