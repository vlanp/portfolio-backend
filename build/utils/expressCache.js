import stableStringify from "json-stable-stringify";
class ExpressCache {
    constructor() {
        this.cache = new Map();
        setInterval(() => {
            this.cleanup();
        }, 60 * 10 * 1000); // Cleanup every 10 minutes
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new this();
        }
        return this.instance;
    }
    get(key) {
        const cachedItem = this.cache.get(key);
        if (cachedItem) {
            return cachedItem.data;
        }
        return undefined;
    }
    set(key, value, timeToLiveMs, dependencies = []) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now(),
            dependencies,
            timeToLiveMs,
        });
    }
    invalidate(key) {
        this.cache.delete(key);
    }
    invalidateByDependency(dependency) {
        for (const [key, value] of this.cache.entries()) {
            if (value.dependencies.includes(dependency)) {
                this.cache.delete(key);
            }
        }
    }
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > value.timeToLiveMs) {
                this.cache.delete(key);
            }
        }
    }
    clear() {
        this.cache.clear();
    }
}
const genCacheKey = (req) => {
    const { method, originalUrl } = req;
    const query = req.query ? stableStringify(req.query) : "";
    const body = req.body ? stableStringify(req.body) : "";
    return `${method}-${originalUrl}-${query}-${body}`;
};
const expressCache = ({ dependencies = [], timeToLiveMin = 1, }) => {
    const timeToLiveMs = timeToLiveMin * 60 * 1000;
    const cache = ExpressCache.getInstance();
    return (req, res, next) => {
        if (req.method !== "GET") {
            next();
            return;
        }
        const cacheKey = genCacheKey(req);
        const cachedResponse = cache.get(cacheKey);
        if (cachedResponse) {
            res.status(200).json(cachedResponse);
            return;
        }
        let responseStatus = 200;
        const originalStatus = res.status;
        res.status = function (code) {
            responseStatus = code;
            return originalStatus(code);
        };
        const originalJson = res.json;
        res.json = function (body) {
            if (responseStatus >= 200 && responseStatus < 300) {
                cache.set(cacheKey, body, timeToLiveMs, dependencies);
            }
            return originalJson(body);
        };
        next();
    };
};
const invalidateCache = (dependency) => {
    const cache = ExpressCache.getInstance();
    cache.invalidateByDependency(dependency);
};
export default expressCache;
export { invalidateCache };
