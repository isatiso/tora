/**
 * @abstract CacheProxy
 */
export abstract class CacheProxy {

    abstract set_cache_options(options: {
        cache_expires: number
        cache_prefix: string
    }): void

    abstract clear(key: string): Promise<number>

    abstract get(key?: string): Promise<any | null>

    abstract set(value: any): Promise<void>

}
