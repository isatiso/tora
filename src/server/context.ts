import { InnerFinish, OuterFinish, throw_reasonable } from '../error'
import { LiteContext } from '../types'
import { Authenticator } from './service/authenticator'
import { CacheProxy } from './service/cache-proxy'

/**
 * @author plankroot
 * @class
 * @name SessionContext
 * @description Request session context for data transform.
 */
export class SessionContext<USER extends object = any> {

    constructor(
        private ctx: LiteContext,
        private auth: Authenticator<USER>,
        private cache?: CacheProxy,
        cache_prefix?: string,
        cache_expires?: number,
    ) {
        this.auth?.load_token(ctx)
        this.cache?.set_cache_options({
            cache_prefix: cache_prefix ?? this.ctx.path,
            cache_expires: cache_expires ?? 3600
        })
    }

    /**
     * @return url of request, include query string.
     */
    get url() {
        return this.ctx.req.url
    }

    /**
     * @return method of request.
     */
    get method() {
        return this.ctx.req.method
    }

    /**
     * @return url of request, exclude query string.
     */
    get path() {
        return this.ctx.path
    }

    /**
     * @return ip address of request, from header X-Real-Ip or X-Forward-For or remote-address.
     */
    get real_ip() {
        return this.ctx.request.get('X-Real-Ip') ?? this.ctx.ip
    }

    /**
     * @return raw string of request body.
     */
    get rawBody() {
        return this.ctx.request.rawBody
    }

    /**
     * @return query object which parsed from query string.
     */
    get query() {
        return this.ctx.query
    }

    /**
     * @return user info, if user info is not exist, throw a 401 Unauthorized Error.
     */
    get user(): USER {
        return this.auth?.get_user_info() ?? throw_reasonable(401, 'Unauthorized.')
    }

    /**
     * @return user info, if user info is not exist, return undefined.
     */
    get maybe_user(): USER | undefined {
        return this.auth?.get_user_info()
    }

    header(key: string) {
        return this.ctx.request.headers[key.toLowerCase()]
    }

    headers() {
        return this.ctx.request.headers
    }

    response_header(key: string, value: string | number) {
        this.ctx.response.set(key.toLowerCase(), value + '')
    }

    async do_auth(): Promise<USER | undefined> {
        return this.auth?.auth()
    }

    redirect(url: string, alt?: string): never {
        this.ctx.redirect(url, alt)
        throw new OuterFinish(this.ctx, '')
    }

    finish(data: any): never {
        throw new InnerFinish(data)
    }

    async clear_cache(key: string) {
        return this.cache?.clear(key)
    }

    async return_if_cache(key?: string) {
        const cache = key && await this.cache?.get(key)
        if (cache) {
            this.finish(cache)
        }
        return null
    }

    async finish_and_cache<T>(info_promise: Promise<T> | T): Promise<T>
    async finish_and_cache<T>(info_promise: Promise<T> | T, also_return: true): Promise<never>
    async finish_and_cache<T>(info_promise: Promise<T> | T, also_return?: true): Promise<T | never> {
        const info = await info_promise
        await this.cache?.set(info)

        if (also_return) {
            this.finish(info)
        }
        return Promise.resolve(info)
    }
}
