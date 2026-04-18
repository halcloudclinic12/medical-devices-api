import Redis from 'ioredis';
import crypto from 'crypto';

import config from '../../config/app-config';
import LoggerService from './logger-service';
import constants from '../../utils/constants';

export class RedisService {
    private readonly redis: Redis;
    private static instance: RedisService;

    private constructor() {
        if (config.REDIS.ENABLED) {
            this.redis = new Redis({
                host: config.REDIS.HOST,
                port: config.REDIS.PORT || 6379,
                password: config.REDIS.PASSWORD || undefined,
                retryStrategy: (times) => Math.min(times * 50, 2000),
            });
            this.redis.on('connect', () => {
                console.log('🔗 RedisService connected');
            });

            this.redis.on('error', (err) => {
                console.error('❌ RedisService connection error:', err);
            });
        }
    }

    static getInstance(): RedisService {
        if (config.REDIS.ENABLED) {
            if (!RedisService.instance) {
                RedisService.instance = new RedisService();
            }
            return RedisService.instance;
        }
    }

    async get(key: string): Promise<any> {
        try {
            const result = await this.redis.get(key);
            return result ? JSON.parse(result) : null;
        } catch (error) {
            LoggerService.log('error', { error: error, message: 'Redis read error:' });
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = constants.REDIS_TIMEOUT_SECONDS): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Redis write error:' });
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Redis delete error:' });
        }
    }

    async deleteKeysByPrefix(prefix: string): Promise<void> {
        const stream = this.redis.scanStream({
            match: `${prefix}*`,
            count: 100
        });

        const pipeline = this.redis.pipeline();

        return new Promise((resolve, reject) => {
            stream.on('data', (keys: string[]) => {
                if (keys.length) {
                    keys.forEach(key => pipeline.del(key));
                }
            });
            stream.on('end', async () => {
                await pipeline.exec();
                resolve();
            });
            stream.on('error', reject);
        });
    }

    async flushAll(): Promise<void> {
        try {
            await this.redis.flushall();
        } catch (error: any) {
            LoggerService.log('error', { error: error, message: 'Redis flush error:' });
        }
    }

    async writeToCache(cacheKey: string, data: any, itemName: string, location: string) {
        if (config.REDIS.ENABLED && cacheKey && data) {
            try {
                await RedisService.getInstance()?.set(cacheKey, data, config.REDIS.REDIS_TIMEOUT_SECONDS);
            } catch (error: any) {
                LoggerService.log('error', { error: error, message: `Error in writing ${itemName} to redis cache`, location: location });
            }
        }
    }

    async invalidateCache(key: string, itemName: string, location: string) {
        if (config.REDIS.ENABLED) {
            // Invalidate clay body cache from redis
            try {
                await RedisService.getInstance()?.deleteKeysByPrefix(key);
            } catch (error: any) {
                LoggerService.log('error', { error: error, message: `Error in deleting ${itemName} redis cache`, location: location });
            }
        }
    }

    generateCacheKey(input: any) {
        const keyObject: any = {
            where: input.where || {},
        };

        if (input.searchFilter && input.searchFilter.length > 0) {
            keyObject.search = input.searchFilter;
        }
        // This is for glaze
        if (input.grouping && input.grouping.length > 0) {
            keyObject.grouping = input.grouping;
        }
        if (input.sort && Object.keys(input.sort).length > 0) {
            keyObject.sort = input.sort;
        }
        if (typeof input.skip === 'number') {
            keyObject.skip = input.skip;
        }
        if (typeof input.pageSize === 'number') {
            keyObject.pageSize = input.pageSize;
        }

        // Convert to stable JSON string
        const stableString = JSON.stringify(this.sortObjectDeep(keyObject));

        // Create MD5 hash
        const hash = crypto.createHash('md5').update(stableString).digest('hex');
        return `${input.prefix}:${hash}`;
    }

    /*
        Recursively sort an object by its keys.
        This is useful for generating a stable JSON string for hashing.
        It handles nested objects and arrays.
        
        { a: 1, b: 2 } and { b: 2, a: 1 } should result in same cache key
    */
    sortObjectDeep = (obj: any): any => {
        if (Array.isArray(obj)) {
            return obj.map(this.sortObjectDeep);
        } else if (obj !== null && typeof obj === 'object') {
            return Object.keys(obj)
                .sort()
                .reduce((result: any, key) => {
                    result[key] = this.sortObjectDeep(obj[key]);
                    return result;
                }, {});
        }
        return obj;
    }

    async getRedisStatus() {
        if (config.REDIS.ENABLED) {
            try {
                const info = await RedisService.getInstance()['redis'].info();
                const usedMemoryMatch = info.match(/used_memory_human:(.*)/);
                const totalKeys = await RedisService.getInstance()['redis'].dbsize();

                return {
                    success: true,
                    used_memory: usedMemoryMatch ? usedMemoryMatch[1] : 'unknown',
                    total_keys: totalKeys
                };
            } catch (err) {
                return Promise.reject({ success: false, error: err.message });
            }
        } else {
            return {
                success: false,
                message: 'Redis is not enabled in the configuration'
            };
        }
    }

    async flushRedisCache() {
        if (config.REDIS.ENABLED) {
            try {
                await RedisService.getInstance()?.flushAll();
                return { success: true, message: 'Redis cache flushed' };
            } catch (err) {
                return Promise.reject({ success: false, error: err.message });
            }
        } else {
            return {
                success: false,
                message: 'Redis is not enabled in the configuration'
            };
        }
    }
}
