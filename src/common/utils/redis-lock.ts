import type Redis from 'ioredis';

/**
 * Distributed Lock dùng Redis SET NX EX (atomic acquire + expire).
 * Dùng trong Worker để tránh nhiều instances chạy cùng một job đồng thời.
 */
export namespace RedisLock {
  /**
   * Acquire lock. Trả về true nếu thành công, false nếu lock đã bị instance khác giữ.
   * @param redis   - ioredis client instance
   * @param key     - tên lock (VD: 'lock:sync_new_kline')
   * @param ttlSec  - thời gian lock tự expire (seconds). Phải > thời gian job chạy.
   */
  export async function setLock(
    redis: Redis,
    key: string,
    ttlSec: number,
  ): Promise<boolean> {
    const result = await redis.set(key, '1', 'EX', ttlSec, 'NX');
    return result === 'OK';
  }

  /**
   * Release lock. Gọi trong finally block để giải phóng sớm,
   * thay vì đợi TTL expire.
   */
  export async function releaseLock(redis: Redis, key: string): Promise<void> {
    await redis.del(key);
  }
}
