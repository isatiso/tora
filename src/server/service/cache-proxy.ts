export abstract class CacheProxy {

    abstract set_cache_options(options: {
        cache_expires: number
        cache_prefix: string
    }): void

    abstract async clear(key: string): Promise<number>

    abstract async get(key?: string): Promise<any | null>

    abstract async set(value: any): Promise<void>

}
