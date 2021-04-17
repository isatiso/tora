/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { InnerFinish, OuterFinish, throw_reasonable } from '../error'
import { CacheProxy } from '../service/cache-proxy'
import { LiteContext } from '../types'

/**
 * 请求上下文对象。
 *
 * @category Builtin
 */
export class SessionContext {

    private readonly cache_prefix: string
    private readonly cache_expires: number
    private cache_key?: string
    private _custom_data: Partial<ToraSession> = {}

    constructor(
        private ctx: LiteContext,
        private token: ToraAuthInfo,
        private cache: CacheProxy | undefined,
        cache_prefix?: string,
        cache_expires?: number,
    ) {
        this.cache_prefix = cache_prefix ?? this.ctx.path
        this.cache_expires = cache_expires ?? 3600
    }

    /**
     * 返回请求的 URL，包含 querystring 部分。
     */
    get url() {
        return this.ctx.req.url
    }

    /**
     * 返回请求的 HTTP 谓词，比如 GET，POST 等。
     */
    get method() {
        return this.ctx.req.method
    }

    /**
     * 返回请求路径，比如 `/test/return-value`
     */
    get path() {
        return this.ctx.path
    }

    /**
     * 返回请求的客户端 IP 地址，优先使用请求头 X-Real-Ip，如果找不到则使用 X-Forward-For 中的第一个 IP 地址。
     */
    get real_ip() {
        return this.ctx.request.get('X-Real-Ip') || this.ctx.request.get('X-Forwarded-For')?.split(',')[0] || this.ctx.ip
    }

    /**
     * 返回请求体的原始内容。
     */
    get rawBody() {
        return this.ctx.request.rawBody
    }

    /**
     * 以 `NodeJS.Dict` 形式返回解析后的 querystring。
     */
    get query(): NodeJS.Dict<string | string[]> {
        return this.ctx.query
    }

    /**
     * @deprecated
     * 返回用户信息，如果用户信息不存在，则认为未授权操作，返回 `401 Unauthorized Error`。
     */
    get user(): ToraAuthInfo {
        return this.token ?? throw_reasonable(401, 'Unauthorized.')
    }

    /**
     * 返回用户信息，如果用户信息不存在，返回 undefined。
     */
    get auth_info(): ToraAuthInfo | undefined {
        return this.token
    }

    set_data<M extends keyof ToraSession>(key: M, value: ToraSession[M]) {
        this._custom_data[key] = value
    }

    get_data<M extends keyof ToraSession>(key: M): ToraSession[M] | undefined {
        return this._custom_data[key]
    }

    /**
     * 获取指定的请求头。
     *
     * @param key 请求头名称，比如 `Content-Type`
     */
    header(key: string): string | string[] | undefined {
        return this.ctx.request.headers[key.toLowerCase()]
    }

    /**
     * 以 `NodeJS.Dict` 形式返回全部请求头。
     */
    headers(): NodeJS.Dict<string | string[]> {
        return this.ctx.request.headers
    }

    /**
     * 设置响应头。
     *
     * @param key 响应头字段，比如 `Content-Type`
     * @param value 需要设置的值
     */
    response_header(key: string, value: string | number) {
        this.ctx.response.set(key.toLowerCase(), value + '')
    }

    /**
     * 执行一次向 `url` 的 302 重定向。
     * 字符串 “back” 是特别提供 Referrer 支持的，当 Referrer 不存在时，使用 alt 或 `/`。
     *
     * e.g.
     * this.redirect('back');
     * this.redirect('back', '/index.html');
     * this.redirect('/login');
     * this.redirect('http://google.com');
     */
    redirect(url: string, alt?: string): never {
        this.ctx.redirect(url, alt)
        throw new OuterFinish(this.ctx, '')
    }

    /**
     * 结束并返回请求处理结果。
     *
     * @param result 请求处理结果。
     */
    finish(result: any): never {
        throw new InnerFinish(result)
    }

    /**
     * 清除缓存，参考 [[CacheProxy.clear]]。
     *
     * @param key
     */
    async clear_cache(key: string) {
        return this.cache?.clear(key, this.cache_prefix, this.cache_expires)
    }

    /**
     * 查询缓存，如果缓存存在则直接返回结果。参考 [[CacheProxy.get]]。
     *
     * @param key
     */
    async return_if_cache(key: string) {
        if (!this.cache_key) {
            this.cache_key = key
        }
        const cache = key && await this.cache?.get(key, this.cache_prefix, this.cache_expires)
        if (cache) {
            this.finish(cache)
        }
        return null
    }

    /**
     * 设置缓存并返回请求处理结果。参考 [[CacheProxy.set]]。
     *
     * @param may_be_promised
     */
    async finish_and_cache<T>(may_be_promised: Promise<T> | T): Promise<T>
    async finish_and_cache<T>(may_be_promised: Promise<T> | T, finish: true): Promise<never>
    async finish_and_cache<T>(may_be_promised: Promise<T> | T, finish?: true): Promise<T | never> {
        const info = await may_be_promised
        if (this.cache_key) {
            await this.cache?.set(this.cache_key, info, this.cache_prefix, this.cache_expires)
        }
        if (finish) {
            this.finish(info)
        }
        return Promise.resolve(info)
    }
}
