import { BuiltInModule } from './builtin/built-in.module'
import { Injector, Provider, ValueProvider } from './di'
import { FinishProcess, LocalFinishProcess, LsError } from './error'
import { find_usage, ProviderTreeNode } from './fm-module'
import {
    ApiParams,
    Authenticator,
    CacheProxy,
    FmKoa,
    FmServer,
    LifeCycle,
    LiteContext,
    PURE_PARAMS,
    SessionContext,
    SessionData
} from './server'
import { FM_DI_TOKEN, TokenUtils } from './token'
import { HandlerDescriptor } from './type'

export class Platform {

    private readonly started_at: number
    private modules: {
        [prop: string]: any
    } = {}
    private root_injector = Injector.create()
    private _server = new FmServer()
    private _koa = new FmKoa({ cors: true, body_parser: true })

    constructor() {
        this.started_at = new Date().getTime()
        this._server.on('GET', '/health-check', () => '')
        this.root_injector.set_provider(Authenticator, new ValueProvider('Authenticator', null))
        this.root_injector.set_provider(CacheProxy, new ValueProvider('CacheProxy', null))
        this.root_injector.set_provider(LifeCycle, new ValueProvider('LifeCycle', null))
        Reflect.getMetadata(FM_DI_TOKEN.module_provider_collector, BuiltInModule)?.(this.root_injector)
    }

    loading_message(env: string, port: number) {
        console.log(`fm-ts-backend starting...`)
        console.log(`    using environment ${env}...`)
        console.log(`    listen at port ${port}...`)
        return this
    }

    register_module(name: string, module: any) {
        this.modules[name] = module
        return this
    }

    select_module(keys: string[]) {
        console.log('selected servers:', keys)
        keys.map(k => this.modules[k])
            .filter(m => m)
            .forEach(m => this.bootstrap(m))
        return this
    }

    bootstrap(root_module: any) {

        TokenUtils.ensureClassType(root_module, 'fm_module')

        const sub_injector = Injector.create(this.root_injector)
        const provider_tree: ProviderTreeNode = Reflect.getMetadata(FM_DI_TOKEN.module_provider_collector, root_module)?.(sub_injector)

        sub_injector.get(Authenticator)?.set_used()
        sub_injector.get(LifeCycle)?.set_used()
        sub_injector.get(CacheProxy)?.set_used()

        const router_module = Reflect.getMetadata(FM_DI_TOKEN.module_router_gate, root_module)
        Reflect.getMetadata(FM_DI_TOKEN.router_handler_collector, router_module)?.(sub_injector)?.forEach((desc: HandlerDescriptor) => {
            if (!desc.disabled) {
                const provider_list = this.get_providers(desc, sub_injector, [ApiParams, SessionContext, SessionData, PURE_PARAMS])
                provider_list.forEach(p => p.create?.())
                desc.methods.forEach(m => this._server.on(m, '/' + desc.path, PlatformStatic.makeHandler(sub_injector, desc, provider_list)))
            }
        })

        provider_tree.children.filter(def => !find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${root_module.name} -> ${def.name} not used.`)
            })

        return this
    }

    koa_use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
        return this
    }

    show_api_list() {
        const handler_list = this._server.get_handler_list()
        console.log('\nUsable API list:')
        for (const desc of handler_list) {
            console.log(`    ${desc.method.padEnd(7)}`, desc.path)
        }
        return this
    }

    start(port: number) {
        this._koa.handle_by(this._server)
            .listen(port, () => {
                const duration = new Date().getTime() - this.started_at
                console.log(`\nfm-ts-backend started successfully in ${duration / 1000}s.`)
            })
    }

    private get_providers(desc: HandlerDescriptor, injector: Injector, except_list?: any[]): Provider<any>[] {
        return desc.param_types?.map((token: any, i: number) => {
            if (token === undefined) {
                throw new Error(`type 'undefined' at ${desc.pos}[${i}], if it's not specified, there maybe a circular import.`)
            }
            if (except_list?.includes(token) || desc.inject_except_list?.includes(token)) {
                return token
            } else {
                const provider = injector.get(token, desc.pos)
                if (provider) {
                    return provider
                }
            }
            throw new Error(`Can't find provider of "${token}" in [${desc.pos}, args[${i}]]`)
        }) ?? []
    }
}

namespace PlatformStatic {

    export function finish_process(ctx: LiteContext, r: any) {
        ctx.response.body = r
    }

    export function deal_wrapper(wrap: boolean | undefined, res: any) {
        if (wrap) {
            if (Array.isArray(res)) {
                return { data: { results: res } }
            } else {
                return { data: res }
            }
        } else {
            return res
        }
    }

    export async function run_handler(cs: LiteContext, handler_wrapper: () => any) {
        try {
            return await handler_wrapper?.()
        } catch (reason) {
            if (reason instanceof LocalFinishProcess) {
                return await reason.body
            } else if (reason instanceof FinishProcess) {
                return reason
            } else {
                return new ErrorWrapper(reason)
            }
        }
    }

    export function makeHandler(injector: Injector, desc: HandlerDescriptor, provider_list: Provider<any>[]) {

        return async function(params: any, cs: LiteContext) {

            const cache: CacheProxy | undefined = injector.get(CacheProxy)?.create()
            const hooks: LifeCycle | undefined = injector.get(LifeCycle)?.create()
            const auth: Authenticator<any> = injector.get(Authenticator)?.create()

            const data = new SessionData()
            const context = new SessionContext(cs, auth, cache, desc.cache_prefix, desc.cache_expires)

            await hooks?.on_init(context, data)

            if (desc.auth) {
                if (!auth) {
                    throw new Error(`no provider for <Authenticator>.`)
                }
                if (await context.do_auth() === undefined) {
                    finish_process(cs, { error: { code: 401, msg: 'Unauthorized.' } })
                }
            }

            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === PURE_PARAMS) {
                    return params
                } else if (provider === ApiParams) {
                    return new ApiParams(params)
                } else if (provider === SessionContext) {
                    return context
                } else if (provider === SessionData) {
                    return data
                } else {
                    return provider.create()
                }
            })

            const res = await run_handler(cs, () => desc.handler(...param_list))

            if (res instanceof ErrorWrapper) {
                await hooks?.on_error(context, data, res.err)
                finish_process(cs, { error: res.err_data })
            } else if (res instanceof FinishProcess) {
                await hooks?.on_finish(context, data)
                finish_process(cs, res.body)
            } else {
                await hooks?.on_finish(context, data)
                finish_process(cs, deal_wrapper(desc.wrap_result, res))
            }
        }
    }
}

class ErrorWrapper<T> {
    public readonly err_data: any

    constructor(public readonly err: T) {
        if (err instanceof LsError) {
            this.err_data = err.toJson()
        } else if (err instanceof Error) {
            this.err_data = { msg: err.message + '\n' + err.stack }
        } else if (err instanceof String) {
            this.err_data = { msg: err.toString() }
        } else if (typeof err === 'string') {
            this.err_data = { msg: err }
        } else {
            this.err_data = err
        }
    }
}
