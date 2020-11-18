import { BuiltInModule } from './builtin/built-in.module'
import { Injector, ValueProvider } from './di'
import { InnerFinish, OuterFinish, ReasonableError } from './error'
import { ApiParams, Authenticator, CacheProxy, LifeCycle, PURE_PARAMS, ResultWrapper, SessionContext, SessionData, ToraServer } from './server'
import { CLS_TYPE, DI_TOKEN, TokenUtils } from './token'
import { ToraKoa } from './tora-koa'
import { find_usage, ProviderTreeNode } from './tora-module'
import { HandlerDescriptor, LiteContext, Provider } from './types'

/**
 * Platform of Tora, where is a place of actual execution.
 */
export class Platform {

    private readonly started_at: number
    private modules: {
        [prop: string]: any
    } = {}
    private root_injector = Injector.create()
    private _server = new ToraServer()
    private _koa = new ToraKoa({ cors: true, body_parser: true })

    constructor() {
        this.started_at = new Date().getTime()
        this._server.on('GET', '/health-check', () => '')
        this.root_injector.set_provider(Authenticator, new ValueProvider('Authenticator', null))
        this.root_injector.set_provider(CacheProxy, new ValueProvider('CacheProxy', null))
        this.root_injector.set_provider(LifeCycle, new ValueProvider('LifeCycle', null))
        Reflect.getMetadata(DI_TOKEN.module_provider_collector, BuiltInModule)?.(this.root_injector)
    }

    /**
     * @function
     *
     * Print message before loading platform.
     *
     * @param port(number) - port to listen.
     * @param infos(string[]) - extra infos to be print.
     */
    loading_message(port: number, infos?: string[]) {
        console.log(`tora server starting...`)
        console.log(`    listen at port ${port}...`)
        for (const info of infos ?? []) {
            console.log(info)
        }
        return this
    }

    /**
     * @function
     *
     * Register module for Platform.select_module.
     *
     * @param name(string) - module name
     * @param module(ToraModule) - module object
     */
    register_module(name: string, module: any) {
        if (TokenUtils.getClassType(module) !== CLS_TYPE.tora_module) {
            throw new Error(`${module.name ?? module.prototype?.toString()} is not a "tora_module".`)
        }
        const router_gate = TokenUtils.getRouterGate(module)
        if (!router_gate) {
            throw new Error(`"router_gate" should be set with a "tora_router".`)
        }
        if (TokenUtils.getClassType(router_gate) !== CLS_TYPE.tora_router) {
            throw new Error(`${router_gate.name ?? router_gate.prototype?.toString()} is not a "tora_router". Only a "tora_module" with "tora_router" can be registered.`)
        }
        this.modules[name] = module
        return this
    }

    /**
     * @function
     *
     * Select registered module to bootstrap.
     *
     * Usually prepare a lot of module by Platform.register_module.
     * Then select some of them by command args.
     *
     * @param keys(string[]) - a list of module name
     */
    select_module(keys: string[]) {
        const unknown_keys = keys.filter(k => !this.modules[k])
        if (unknown_keys?.length) {
            throw new Error(`Module: "${unknown_keys}" not registered.`)
        }
        console.log('selected servers:', keys)
        keys.map(k => this.modules[k])
            .filter(m => m)
            .forEach(m => this.bootstrap(m))
        return this
    }

    /**
     * @function
     *
     * Expose of Koa.use
     *
     * @param middleware
     */
    koa_use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
        return this
    }

    /**
     * @function
     *
     * Print all handler to stdout.
     */
    show_api_list() {
        const handler_list = this._server.get_handler_list()
        console.log('\nUsable API list:')
        for (const desc of handler_list) {
            console.log(`    ${desc.method.padEnd(7)}`, desc.path)
        }
        return this
    }

    /**
     * @function
     *
     * Start listening of server.
     *
     * @param port
     */
    start(port: number) {
        this._koa.handle_by(this._server)
            .listen(port, () => {
                const duration = new Date().getTime() - this.started_at
                console.log(`\ntora server started successfully in ${duration / 1000}s.`)
            })
    }

    /**
     * @function
     *
     * Bootstrap module directly.
     *
     * @param root_module(ToraModule) - module to load.
     */
    private bootstrap(root_module: any) {
        console.log('root_module', root_module)

        TokenUtils.ensureClassType(root_module, 'tora_module')

        const sub_injector = Injector.create(this.root_injector)
        const provider_tree: ProviderTreeNode = Reflect.getMetadata(DI_TOKEN.module_provider_collector, root_module)?.(sub_injector)

        sub_injector.get(Authenticator)?.set_used()
        sub_injector.get(LifeCycle)?.set_used()
        sub_injector.get(CacheProxy)?.set_used()

        const router_module = Reflect.getMetadata(DI_TOKEN.module_router_gate, root_module)
        Reflect.getMetadata(DI_TOKEN.router_handler_collector, router_module)?.(sub_injector)?.forEach((desc: HandlerDescriptor) => {
            if (!desc.disabled) {
                const provider_list = this.get_providers(desc, sub_injector, [ApiParams, SessionContext, SessionData, PURE_PARAMS])
                provider_list.forEach(p => p.create?.())
                desc.methods.forEach(m => this._server.on(m, '/' + desc.path, PlatformStatic.makeHandler(sub_injector, desc, provider_list)))
            }
        })

        provider_tree.children.filter(def => !find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${root_module.name} -> ${def?.name} not used.`)
            })

        return this
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

/**
 * @namespace PlatformStatic
 *
 * collection functions
 */
namespace PlatformStatic {

    export function finish_process(ctx: LiteContext, r: any) {
        ctx.response.body = r
    }

    export async function run_handler(cs: LiteContext, handler_wrapper: () => any) {
        try {
            return await handler_wrapper?.()
        } catch (reason) {
            if (reason instanceof InnerFinish) {
                return await reason.body
            } else if (reason instanceof OuterFinish) {
                return reason
            } else {
                return new ErrorWrapper(reason)
            }
        }
    }

    export function makeHandler(injector: Injector, desc: HandlerDescriptor, provider_list: Provider<any>[]) {

        return async function(params: any, cs: LiteContext) {

            const cache: CacheProxy | undefined = injector.get(CacheProxy)?.create()
            const result_wrapper: ResultWrapper | undefined = injector.get(ResultWrapper)?.create()
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
                    return finish_process(cs, { error: { code: 401, msg: 'Unauthorized.' } })
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
                await hooks?.on_error(context, data, res)
                finish_process(cs, { error: res.err_data })
            } else if (res instanceof OuterFinish) {
                await hooks?.on_finish(context, data)
                finish_process(cs, res.body)
            } else {
                await hooks?.on_finish(context, data)
                const real_result = desc.wrap_result ? result_wrapper?.wrap(res) ?? res : res
                finish_process(cs, real_result)
            }
        }
    }
}

class ErrorWrapper<T> {

    public readonly err_data: any
    public readonly err_type: 'reasonable' | 'crash'

    constructor(public readonly err: T) {
        if (err instanceof ReasonableError) {
            this.err_type = 'reasonable'
            this.err_data = err.toJson()
        } else if (err instanceof Error) {
            this.err_type = 'crash'
            this.err_data = { msg: err.message + '\n' + err.stack }
        } else if (err instanceof String) {
            this.err_type = 'crash'
            this.err_data = { msg: err.toString() }
        } else if (typeof err === 'string') {
            this.err_type = 'crash'
            this.err_data = { msg: err }
        } else {
            this.err_type = 'crash'
            this.err_data = err
        }
    }
}

export type ToraError<T> = ErrorWrapper<T>
