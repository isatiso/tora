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

    /**
     * @function Get header of specified key.
     * @param key(string) - eg. Content-Type
     */
    header(key: string) {
        return this.ctx.request.headers[key.toLowerCase()]
    }

    /**
     * @function Get all headers as a dict.
     */
    headers() {
        return this.ctx.request.headers
    }

    /**
     * @function Set header of response.
     * @param key(string) - eg. Content-Type.
     * @param value(string | number) - eg. application/json.
     */
    response_header(key: string, value: string | number) {
        this.ctx.response.set(key.toLowerCase(), value + '')
    }

    /**
     * @function check authorization of client info, like cookie things, depends on implementation.
     *
     * @return (USER) user info or undefined.
     */
    async do_auth(): Promise<USER | undefined> {
        return this.auth?.auth()
    }

    /**
     * @function Perform a 302 redirect to `url`.
     *
     * The string "back" is special-cased
     * to provide Referrer support, when Referrer
     * is not present `alt` or "/" is used.
     *
     * @example:
     *    this.redirect('back');
     *    this.redirect('back', '/index.html');
     *    this.redirect('/login');
     *    this.redirect('http://google.com');
     */
    redirect(url: string, alt?: string): never {
        this.ctx.redirect(url, alt)
        throw new OuterFinish(this.ctx, '')
    }

    /**
     * @function Finish process of handler and go next.
     * @param data: result of process.
     */
    finish(data: any): never {
        throw new InnerFinish(data)
    }

    /**
     * @function Clear cache of response of specified key.
     * @param key(string)
     */
    async clear_cache(key: string) {
        return this.cache?.clear(key)
    }

    /**
     * @function
     *
     * Search exist cache data. and store the key.
     *
     * @param key(string)
     */
    async return_if_cache(key?: string) {
        const cache = key && await this.cache?.get(key)
        if (cache) {
            this.finish(cache)
        }
        return null
    }

    /**
     * @function
     *
     * Cache data with key which save in ServerContext.return_if_cache and finish.
     *
     * @param info_promise
     */
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
