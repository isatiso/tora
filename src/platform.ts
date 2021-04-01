import fs from 'fs'
import path from 'path'
import { ConfigData, ToraConfig } from './builtin'
import { BuiltInModule } from './builtin/built-in.module'
import { Injector, ValueProvider } from './di'
import { def2Provider } from './di/provider'
import { InnerFinish, OuterFinish, ReasonableError } from './error'
import { ApiParams, Authenticator, CacheProxy, LifeCycle, PURE_PARAMS, ResultWrapper, SessionContext, SessionData, ToraServer } from './server'
import { CLS_TYPE, DI_TOKEN, TokenUtils } from './token'
import { ToraKoa } from './tora-koa'
import { find_usage, ProviderTreeNode } from './tora-module'
import { ApiMethod, ApiPath, ApiReturnDataType, HandlerDescriptor, HandlerReturnType, LiteContext, Provider, ProviderDef, Type } from './types'

function _try_read_json(file: string) {
    try {
        const res = JSON.parse(fs.readFileSync(path.resolve(file)).toString('utf-8'))
        if (!res) {
            console.error('Specified configuration file is empty.')
            process.exit(1)
        }
        return res
    } catch (e) {
        console.error(`Parse configuration file failed.`)
        console.error(`    File: ${path.resolve(file)}`)
        console.error(`    Error: ${e.message}`)
        process.exit(1)
    }
}

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
    private _config_data?: ConfigData<ToraConfig>

    constructor() {
        this.started_at = new Date().getTime()
        this.root_injector.set_provider(Authenticator, new ValueProvider('Authenticator', null))
        this.root_injector.set_provider(CacheProxy, new ValueProvider('CacheProxy', null))
        this.root_injector.set_provider(LifeCycle, new ValueProvider('LifeCycle', null))
        this.root_injector.set_provider(ResultWrapper, new ValueProvider('ResultWrapper', null))
        Reflect.getMetadata(DI_TOKEN.module_provider_collector, BuiltInModule)?.(this.root_injector)
    }

    provide(def: (ProviderDef | Type<any>)) {
        const [token, provider] = def2Provider([def], this.root_injector)[0]
        this.root_injector.set_provider(token, provider)
        return this
    }

    import(module: any) {
        TokenUtils.ensureClassType(module, 'tora_module')
        Reflect.getMetadata(DI_TOKEN.module_provider_collector, module)?.(this.root_injector)
        return this
    }

    /**
     * @deprecated
     *
     * @param method
     * @param path
     */
    health_check(method: ApiMethod, path: ApiPath) {
        this._server.on(method, path, () => '')
        return this
    }

    /**
     *
     * @param method
     * @param path
     */
    handle(method: ApiMethod, path: ApiPath): Platform
    handle<R extends ApiReturnDataType>(method: ApiMethod, path: ApiPath, func: () => HandlerReturnType<R>): Platform
    handle(method: ApiMethod, path: ApiPath, func?: () => any) {
        this._server.on(method, path, func ?? (() => ''))
        return this
    }

    /**
     * @function
     *
     * load configuration from file, .
     *
     * @param file_path(string) - path of config file, default is 'config/default.json'.
     */
    load_config(file_path?: string): this
    load_config<T extends ToraConfig>(data: T): this
    load_config<T extends ToraConfig>(data?: string | T) {
        if (!data) {
            if (!fs.existsSync(path.resolve('config/default.json'))) {
                console.error('No specified configuration file, and "config/default.json" not exist.')
                process.exit(1)
            }
            this._config_data = new ConfigData(_try_read_json('config/default.json'))
        } else if (typeof data === 'string') {
            if (!fs.existsSync(path.resolve(path.resolve(data)))) {
                console.error(`Specified configuration file "${data}" not exists.`)
                process.exit(1)
            }
            this._config_data = new ConfigData(_try_read_json(data))
        } else {
            this._config_data = new ConfigData(data)
        }
        this.root_injector.set_provider(ConfigData, new ValueProvider('ConfigData', this._config_data))
        return this
    }

    /**
     * @function
     *
     * Print message before loading platform.
     *
     * @param msg_builder(function) - extra infos to be print.
     */
    loading_message<T extends ToraConfig>(msg_builder: (config: ConfigData<T>) => string[]) {
        if (this._config_data) {
            msg_builder(this._config_data as any)?.forEach(info => console.log(info))
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
        const routers = TokenUtils.getRouters(module)
        if (!routers) {
            throw new Error(`"routers" should be set with a list of "tora_router".`)
        }
        routers.forEach(router => {
            if (TokenUtils.getClassType(router) !== CLS_TYPE.tora_router) {
                throw new Error(`${router.name ?? router.prototype?.toString()} is not a "tora_router". Only a "tora_module" with a list of "tora_router" can be registered.`)
            }
        })
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
     * Start listening of server.
     */
    start() {
        const port = this._config_data?.get('tora.port') ?? 3000

        console.log(`tora server starting...`)
        console.log(`    listen at port ${port}...`)

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

        const routers = TokenUtils.getRouters(root_module)
        routers.forEach(router_module => {
            const router_provider_tree: ProviderTreeNode = Reflect.getMetadata(DI_TOKEN.module_provider_collector, router_module)?.(sub_injector)
            Reflect.getMetadata(DI_TOKEN.router_handler_collector, router_module)?.(sub_injector)?.forEach((desc: HandlerDescriptor) => {
                if (!desc.disabled) {
                    const provider_list = this.get_providers(desc, sub_injector, [ApiParams, SessionContext, SessionData, PURE_PARAMS])
                    provider_list.forEach(p => p.create?.())
                    const real_path = desc.path?.startsWith('/') ? desc.path : '/' + desc.path
                    desc.methods.forEach(m => this._server.on(m, real_path, PlatformStatic.makeHandler(sub_injector, desc, provider_list)))
                }
            })
            router_provider_tree.children.filter(def => !find_usage(def))
                .forEach(def => {
                    console.log(`Warning: ${router_module.name} -> ${def?.name} not used.`)
                })
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
