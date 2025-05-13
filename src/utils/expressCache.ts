import { Request, Response, NextFunction } from "express";
import stableStringify from "json-stable-stringify";

interface ICachedData {
  data: any;
  timestamp: number;
  timeToLiveMs: number;
  dependencies: IDependency[];
}

class ExpressCache {
  private cache: Map<string, ICachedData>;
  private static instance: ExpressCache;

  private constructor() {
    this.cache = new Map();
    setInterval(() => {
      this.cleanup();
    }, 60 * 10 * 1000); // Cleanup every 10 minutes
  }

  public static getInstance(): ExpressCache {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  get(key: string): any | undefined {
    const cachedItem = this.cache.get(key);
    if (cachedItem) {
      return cachedItem.data;
    }
    return undefined;
  }

  set(
    key: string,
    value: any,
    timeToLiveMs: number,
    dependencies: IDependency[] = []
  ): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      dependencies,
      timeToLiveMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByDependency(dependency: IDependency): void {
    for (const [key, value] of this.cache.entries()) {
      if (value.dependencies.includes(dependency)) {
        this.cache.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.timeToLiveMs) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const genCacheKey = (req: Request) => {
  const { method, originalUrl } = req;
  const query = req.query ? stableStringify(req.query) : "";
  const body = req.body ? stableStringify(req.body) : "";
  return `${method}-${originalUrl}-${query}-${body}`;
};

type IDependency = "repo";

const expressCache = ({
  dependencies = [],
  timeToLiveMin = 60,
}: {
  dependencies: IDependency[];
  timeToLiveMin: number;
}) => {
  const timeToLiveMs = timeToLiveMin * 60 * 1000;
  const cache = ExpressCache.getInstance();

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const cacheKey = genCacheKey(req);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      console.log(`Cache hit for ${cacheKey}`);
      res.status(200).json(cachedResponse);
      return;
    }

    let responseStatus = 200;

    const originalStatus = res.status;
    res.status = function (code: number) {
      responseStatus = code;
      return originalStatus.call(this, code);
    };

    const originalJson = res.json;
    res.json = function (body: any) {
      if (responseStatus >= 200 && responseStatus < 300) {
        cache.set(cacheKey, body, timeToLiveMs, dependencies);
      }
      return originalJson.call(this, body);
    };

    next();
  };
};

const invalidateCache = (dependency: IDependency) => {
  const cache = ExpressCache.getInstance();
  cache.invalidateByDependency(dependency);
};

export default expressCache;
export { invalidateCache };
