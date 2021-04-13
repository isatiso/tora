/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Extend this class to implement CacheProxy.
 *
 * @category Abstract Service
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
