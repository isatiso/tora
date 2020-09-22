import { FinishProcess, LocalFinishProcess, throw_fm_panic } from '../error'
import { Authenticator } from './authenticator'
import { CacheProxy } from './cache-proxy'
import { LiteContext } from './types'

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

    get url() {
        return this.ctx.req.url
    }

    get method() {
        return this.ctx.req.method
    }

    get path() {
        return this.ctx.path
    }

    get real_ip() {
        return this.ctx.request.get('X-Real-IP')
    }

    get rawBody() {
        return this.ctx.request.rawBody
    }

    get query() {
        return this.ctx.query
    }

    get user(): USER {
        return this.auth?.get_user_info() ?? throw_fm_panic(401, 'Unauthorized.')
    }

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
        return await this.auth?.auth()
    }

    redirect(url: string, alt?: string): never {
        this.ctx.redirect(url, alt)
        throw new FinishProcess(this.ctx, '')
    }

    finish(data: any): never {
        throw new LocalFinishProcess(data)
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
