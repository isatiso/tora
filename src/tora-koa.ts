/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CoBody from 'co-body'
import Koa from 'koa'
import { ToraServer } from './tora-server'
import { LiteContext } from './types'

declare module 'koa' {
    interface Request {
        body?: any
        rawBody: string
    }
}

/**
 * @private
 * Koa adaptor.
 */
export class ToraKoa {

    private _koa = new Koa()
    private _body_parser = new BodyParser()

    constructor(options: {
        cors?: boolean
        body_parser?: boolean
    }) {
        if (options.cors) {
            this._koa.use(this.cors)
        }
        if (options.body_parser) {
            this._koa.use(this.body_parser)
        }
    }

    /**
     * Expose of Koa.use
     *
     * @param middleware
     */
    use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
    }

    /**
     * Set server handlers.
     *
     * @param server
     */
    handle_by(server: ToraServer) {
        this._koa.use(async (ctx: LiteContext, next) => server.handleRequest(ctx, next))
        return this
    }

    /**
     * Koa listen
     *
     * @param port
     * @param cb
     */
    listen(port: number, cb: () => void): void {
        this._koa.on('error', (err, ctx: LiteContext) => {
            if (err.code !== 'HPE_INVALID_EOF_STATE') {
                console.log('server error', err, ctx)
                console.log(ctx.request.rawBody)
            }
        }).listen(port, cb)
    }

    private body_parser: Koa.Middleware<any> = async (ctx: Koa.Context, next: Koa.Next) => {
        if (ctx.request.body !== undefined || ctx.disableBodyParser) {
            return await next()
        }
        try {
            const res = await this._body_parser.parseBody(ctx)
            ctx.request.body = 'parsed' in res ? res.parsed : {}
            if (ctx.request.rawBody === undefined) {
                ctx.request.rawBody = res.raw
            }
        } catch (err) {
            ctx.response.status = 400
            ctx.response.body = 'Bad Request'
            console.log('parse body error', ctx.request.path)
        }
        return await next()
    }

    private cors: Koa.Middleware<any> = async (ctx: Koa.Context, next: Koa.Next) => {
        ctx.response.res.setHeader('Access-Control-Allow-Origin', '*')
        if (ctx.method === 'OPTIONS') {
            ctx.response.res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin,origin,Content-Type,Accept,Authorization')
            ctx.response.res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
            ctx.response.body = ''
        }
        return await next()
    }
}

class BodyParser {

    private readonly opts: CoBody.Options

    private jsonTypes = ['application/json', 'application/json-patch+json', 'application/vnd.api+json', 'application/csp-report']
    private formTypes = ['application/x-www-form-urlencoded']
    private textTypes = ['text/plain', 'text/xml', 'application/xml', 'text/html']

    constructor() {
        this.opts = { returnRawBody: true }
    }

    async parseBody(ctx: Koa.Context) {
        if (ctx.request.is(this.jsonTypes)) {
            return CoBody.json(ctx, this.opts)
        } else if (ctx.request.is(this.formTypes)) {
            return CoBody.form(ctx, this.opts)
        } else if (ctx.request.is(this.textTypes)) {
            return CoBody.text(ctx, this.opts).then((v: any) => v || '')
        } else {
            return {}
        }
    }
}
