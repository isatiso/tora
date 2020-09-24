import { Request } from 'koa'
import { ApiMethod, ApiPath, ApiReturnDataType, HandlerReturnType, HttpHandler, LiteContext } from '../types'

export class ToraServer {

    private handlers: {
        [path: string]: {
            GET?: HttpHandler
            POST?: HttpHandler
            PUT?: HttpHandler
            DELETE?: HttpHandler
        }
    } = {}

    get_handler_list(need_handler?: boolean) {
        const list: {
            method: ApiMethod,
            path: string
            handler?: HttpHandler
        }[] = []
        for (const path of Object.keys(this.handlers)) {
            for (const method of Object.keys(this.handlers[path]).sort()) {
                if (need_handler) {
                    list.push({ method: method as ApiMethod, path, handler: this.handlers[path]?.[method as ApiMethod] })
                } else {
                    list.push({ method: method as ApiMethod, path })
                }
            }
        }
        return list
    }

    on<T, R extends ApiReturnDataType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>) {
        if (Array.isArray(path)) {
            for (const p of path) {
                this.set_handler(method, p, handler)
            }
        } else {
            this.set_handler(method, path, handler)
        }
    }

    async handleRequest(context: LiteContext, next: Function) {
        const req: Request & { body?: any } = context.request
        const params = req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body
        const res = await this.handlers[req.path]?.[req.method as ApiMethod]?.(params, context)
        if (res !== undefined) {
            context.response.body = res
        }
        return next()
    }

    private set_handler(method: ApiMethod, path: string, handler: HttpHandler) {
        if (!this.handlers[path]) {
            this.handlers[path] = {}
        }
        this.handlers[path][method] = handler
    }
}
