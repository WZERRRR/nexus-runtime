import NodeCache from 'node-cache';

// Cache for 60 seconds by default
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export class RuntimeCache {
  static set(key: string, value: any, ttl?: number) {
    return cache.set(key, value, ttl);
  }

  static get(key: string) {
    return cache.get(key);
  }

  static del(key: string) {
    return cache.del(key);
  }
}
