import { CacheService } from './cache.service';
import Dexie from 'dexie';

export class CacheLocal extends Dexie implements CacheService {
  cacheObjects: Dexie.Table<any, string>;

  constructor() {
    super('cache-objects');
    this.version(0.1).stores({
      cacheObjects: ''
    });
    this.cacheObjects = this.table('cacheObjects');
  }

  /**
   * @override
   */
  async get<T extends object>(hash: string): Promise<T | undefined> {
    return this.cacheObjects.get(hash);
  }

  /**
   * @override
   */
  async cache<T>(hash: string, object: T): Promise<void> {
    await this.cacheObjects.put(object, hash);
  }
}
