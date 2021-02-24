import parse from 'co-body'
import Koa from 'koa'
import { ToraServer } from './server'
import { LiteContext } from './types'

declare module 'koa' {
    interface Request {
        body?: any
        rawBody: string
    }
}

type BodyType = 'text' | 'json' | 'form'

interface Options {

    //  parser will only parse when request type hits enableTypes, default is ['json', 'form'].
    enableTypes?: BodyType[]

    // requested encoding. Default is utf-8 by co-body
    encode?: string

    // when set to true, JSON parser will only accept arrays and objects. Default is true
    strict?: boolean

    returnRawBody?: boolean

    // support extend types
    extendTypes?: {
        json?: string[]
        form?: string[]
        text?: string[]
    }

    // support custom error handle
    onerror?: (err: Error, ctx: Koa.Context) => void
}

/**
 * Koa adaptor.
 */
export class ToraKoa {

    private _koa = new Koa()
    private _body_parser = new BodyParser()

    constructor(options: {
        cors?: boolean
        body_parser?: boolean
    }) {
        this._koa.proxy = true
        if (options.cors) {
            this._koa.use(this.cors)
        }
        if (options.body_parser) {
            this._koa.use(this.body_parser)
        }
    }

    /**
     * @function
     *
     * Expose of Koa.use
     *
     * @param middleware
     */
    use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
    }

    /**
     * @function
     *
     * Set server handlers.
     *
     * @param server(ToraServer)
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

export class BodyParser {

    private readonly opts: Omit<Options, 'onerror'>

    private readonly enableForm: boolean
    private readonly enableJson: boolean
    private readonly enableText: boolean

    private jsonTypes = ['application/json', 'application/json-patch+json', 'application/vnd.api+json', 'application/csp-report']
    private formTypes = ['application/x-www-form-urlencoded']
    private textTypes = ['text/plain', 'text/xml', 'application/xml', 'text/html']

    constructor(options?: Options) {
        this.opts = Object.assign({ returnRawBody: true }, options)
        const enableTypes = this.opts.enableTypes || ['json', 'form', 'text']

        this.enableForm = enableTypes?.includes('form')
        this.enableJson = enableTypes?.includes('json')
        this.enableText = enableTypes?.includes('text')
    }

    async parseBody(ctx: Koa.Context) {
        if (this.enableJson && ctx.request.is(this.jsonTypes)) {
            return parse.json(ctx, this.opts)
        } else if (this.enableForm && ctx.request.is(this.formTypes)) {
            return parse.form(ctx, this.opts)
        } else if (this.enableText && ctx.request.is(this.textTypes)) {
            return parse.text(ctx, this.opts).then((v: any) => v || '')
        } else {
            return {}
        }
    }
}
