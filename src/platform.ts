/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs'
import path from 'path'
import { ApiParams, ConfigData, SessionContext, Timestamp, UUID } from './builtin'
import { Injector } from './injector'
import { ClassProvider, def2Provider, ValueProvider } from './injector/provider'
import { PlatformUtils, PURE_PARAMS } from './platform-utils'
import { Revolver } from './schedule'
import { Authenticator } from './service/authenticator'
import { CacheProxy } from './service/cache-proxy'
import { LifeCycle } from './service/life-cycle'
import { ResultWrapper } from './service/result-wrapper'
import { TaskLifeCycle } from './service/task-life-cycle'
import { TaskLock } from './service/task-lock'
import { TokenUtils } from './token'
import { ToraKoa } from './tora-koa'
import { ToraServer } from './tora-server'
import { ApiMethod, ApiPath, HandlerDescriptor, HandlerReturnType, KoaResponseType, LiteContext, Provider, ProviderDef, ProviderTreeNode, TaskDescriptor, Type } from './types'

function _join_path(front: string, rear: string) {
    return [front, rear].filter(i => i).join('/')
}

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
 * @private
 *
 * 遍历依赖加载树，查找没有被使用的 Tora.ToraModule。
 *
 * @param tree_node
 * @param indent
 */
export function _find_usage(tree_node: ProviderTreeNode, indent: number = 0): boolean {
    return tree_node?.providers?.find(p => p.used)
        || tree_node?.children?.find(t => _find_usage(t, indent + 1))
}

/**
 * Tora 运行时。
 *
 * @category Platform
 */
export class Platform {

    /**
     * @private
     * 记录创建 [[Platform]] 的时间，用于计算启动时间。
     */
    private readonly started_at: number

    /**
     * @private
     * 记录注册的 ToraModule。
     */
    private modules: {
        [prop: string]: any
    } = {}

    /**
     * @private
     * 根注入器，在它上面还有 NullInjector。
     */
    private root_injector = Injector.create()

    /**
     * @private
     * ToraServer 实例，用于集中管理 Handler。
     */
    private _server = new ToraServer()

    /**
     * @private
     * ToraKoa 实例，用于管理 HTTP 连接。
     */
    private _koa = new ToraKoa({ cors: true, body_parser: true })

    /**
     * @private
     * ConfigData 实例，用于管理加载的配置文件内容。
     */
    private _config_data?: ConfigData

    /**
     * @private
     * Revolver 实例，用于管理定时任务。
     */
    private _revolver = new Revolver()

    /**
     * @private
     * 定时器。
     */
    constructor() {
        setInterval(() => {
            this._revolver?.shoot(new Date().getTime())
        }, 100)
        this.started_at = new Date().getTime()
        // 设置默认的内置 Provider，如果没有另外设置 Provider 时，查找结果为 null，而不会查找到 NullInjector。
        this.root_injector.set_provider(Authenticator, new ValueProvider('Authenticator', null))
        this.root_injector.set_provider(CacheProxy, new ValueProvider('CacheProxy', null))
        this.root_injector.set_provider(LifeCycle, new ValueProvider('LifeCycle', null))
        this.root_injector.set_provider(ResultWrapper, new ValueProvider('ResultWrapper', null))
        this.root_injector.set_provider(TaskLifeCycle, new ValueProvider('TaskLifeCycle', null))
        this.root_injector.set_provider(TaskLock, new ValueProvider('TaskLock', null))
        this.root_injector.set_provider(UUID, new ClassProvider(UUID, this.root_injector))
        this.root_injector.set_provider(Timestamp, new ClassProvider(Timestamp, this.root_injector, true))
    }

    /**
     * 直接挂载 ToraService 到 [[Platform.root_injector]] 的接口。
     * @param def
     */
    provide(def: (ProviderDef<any> | Type<any>)) {
        def2Provider([def], this.root_injector)
        return this
    }

    /**
     * 直接加载 ToraModule 到 [[Platform.root_injector]] 的接口。
     * @param module
     */
    import(module: any) {
        if (TokenUtils.ComponentType.get(module) !== 'ToraModule') {
            throw new Error(`${module.name} is not a ToraModule.`)
        }
        TokenUtils.ToraModuleProviderCollector.get(module)?.(this.root_injector)
        return this
    }

    /**
     * 直接挂载 ToraRouter 到 [[Platform.root_injector]] 的接口。
     *
     * @param router_module 需要 ToraRouter。
     */
    route(router_module: Type<any>) {
        this._mount_router(router_module, this.root_injector)
    }

    /**
     * 直接添加 API 的接口。
     * 如果没有设置处理函数，默认返回空字符串。
     *
     * @param method
     * @param path
     * @param func
     */
    handle<R extends KoaResponseType>(method: ApiMethod, path: ApiPath, func?: () => HandlerReturnType<R>): Platform {
        this._server.on<any, any>(method, path, func ?? (() => ''))
        return this
    }

    /**
     * 加载配置文件，读文件方式。
     * @param file_path
     */
    load_config(file_path?: string): this
    /**
     * 加载配置文件，JSON 对象方式。
     * @param data
     */
    load_config(data: ToraConfigSchema): this
    load_config(data?: string | ToraConfigSchema) {
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
     * 自定义启动信息。
     * 设计这个接口的目的是，有时候你可能需要知道程序启动时使用了哪些配置。
     *
     * @param msg_builder
     */
    loading_message(msg_builder: (config: ConfigData) => string[]) {
        if (this._config_data) {
            msg_builder(this._config_data as any)?.forEach(info => console.log(info))
        }
        return this
    }

    /**
     * 注册包含 routers 的 ToraModule。
     * 这里只是做了一个记录，通过调用 [[Platform.select_module]] 进行加载。
     *
     * @param name
     * @param module
     */
    register_module(name: string, module: any) {
        if (TokenUtils.ComponentType.get(module) !== 'ToraModule') {
            throw new Error(`${module.name ?? module.prototype?.toString()} is not a "tora_module".`)
        }

        const routers = TokenUtils.ToraModuleRouters.get(module)
        if (!routers) {
            throw new Error(`"routers" should be set with a list of "@ToraRouter".`)
        } else {
            routers.forEach(router => {
                if (TokenUtils.ComponentType.get(router) !== 'ToraRouter') {
                    throw new Error(`${router.name ?? router.prototype?.toString()} is not a "tora_router". Only a "tora_module" with a list of "tora_router" can be registered.`)
                }
            })
        }
        this.modules[name] = module
        return this
    }

    /**
     * 加载已经注册了的包含 routers 的 ToraModule。
     * 通过调用 [[Platform.register_module]] 进行注册。
     *
     * @param keys
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
     * 直接加载一个包含 routers 的 ToraModule。
     *
     * @param root_module
     */
    bootstrap(root_module: any) {

        console.log('root_module', root_module)

        if (TokenUtils.ComponentType.get(root_module) !== 'ToraModule') {
            throw new Error(`${root_module.name} is not a ToraModule.`)
        }

        const sub_injector = Injector.create(this.root_injector)
        const provider_tree: ProviderTreeNode | undefined = TokenUtils.ToraModuleProviderCollector.get(root_module)?.(sub_injector)

        sub_injector.get(Authenticator)?.set_used()
        sub_injector.get(LifeCycle)?.set_used()
        sub_injector.get(CacheProxy)?.set_used()

        TokenUtils.ToraModuleRouters.get(root_module)?.forEach(router_module => {
            this._mount_router(router_module, sub_injector)
        })

        TokenUtils.ToraModuleTasks.get(root_module)?.forEach(trigger_module => {
            this._mount_task(trigger_module, sub_injector)
        })

        provider_tree?.children.filter(def => !_find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${root_module.name} -> ${def?.name} not used.`)
            })

        return this
    }

    /**
     * 直接暴露的 Koa.use 接口。
     * 考虑到可能需要使用一些 Koa 的插件。
     *
     * @param middleware
     */
    koa_use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void) {
        this._koa.use(middleware)
        return this
    }

    /**
     * 列出全部 API 列表。
     *
     * @param formatter 自定义格式处理函数。
     */
    show_api_list(formatter?: (method: ApiMethod, path: string) => string) {
        const handler_list = this._server.get_handler_list()
        console.log('\nUsable API list:')
        for (const desc of handler_list) {
            console.log(formatter?.(desc.method, desc.path) ?? `    ${desc.method.padEnd(7)} ${desc.path}`)
        }
        return this
    }

    /**
     * 展示任务列表，按执行顺序。
     *
     * @param formatter 自定义格式处理函数。
     */
    show_task_list(formatter?: (task: {
        name: string
        pos: string
        crontab: string
        next_execution: string
    }) => string) {
        const task_list = this._revolver.get_task_list()
        console.log('\nCurrent Task list:')
        for (const task of task_list) {
            console.log(formatter?.(task) ?? `    ${task.next_execution} ${task.crontab} ${task.name.padEnd(7)}`)
        }
        return this
    }

    /**
     * 开始监听请求。
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

    private _mount_router(router_module: Type<any>, injector: Injector) {
        const router_provider_tree: ProviderTreeNode | undefined = TokenUtils.ToraModuleProviderCollector.get(router_module)?.(injector)
        TokenUtils.ToraRouterHandlerCollector.get(router_module)?.(injector)?.forEach((desc: HandlerDescriptor) => {
            if (!desc.disabled) {
                const provider_list = this._get_providers(desc, injector, [ApiParams, SessionContext, PURE_PARAMS])
                provider_list.forEach(p => p.create?.())
                if (desc.method_and_path) {
                    const replacement = TokenUtils.ToraRouterPathReplacement.getset(router_module, {})
                    Object.values(desc.method_and_path)?.forEach(([method, method_path]) => {
                        const figure_method_path = replacement[desc.property_key ?? ''] ?? method_path
                        const router_path = desc.path?.startsWith('/') ? desc.path : '/' + desc.path
                        const full_path = _join_path(router_path, figure_method_path.replace(/(^\/|\/$)/g, ''))
                        this._server.on(method, full_path, PlatformUtils.makeHandler(injector, desc, provider_list))
                    })
                }
            }
        })
        router_provider_tree?.children.filter(def => !_find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${router_module.name} -> ${def?.name} not used.`)
            })
    }

    private _mount_task(trigger_module: Type<any>, injector: Injector) {
        const router_provider_tree: ProviderTreeNode | undefined = TokenUtils.ToraModuleProviderCollector.get(trigger_module)?.(injector)

        TokenUtils.ToraTriggerTaskCollector.get(trigger_module)?.(injector)?.forEach((desc: TaskDescriptor) => {
            if (!desc.disabled) {
                if (!desc.schedule) {
                    throw new Error(`Crontab of task ${desc.pos} is empty.`)
                }
                const provider_list = this._get_providers(desc, injector)
                provider_list.forEach(p => p.create?.())
                this._revolver.fill(desc.schedule, PlatformUtils.makeTask(injector, desc, provider_list), desc)
            }
        })
        router_provider_tree?.children.filter(def => !_find_usage(def))
            .forEach(def => {
                console.log(`Warning: ${trigger_module.name} -> ${def?.name} not used.`)
            })
    }

    private _get_providers(desc: HandlerDescriptor | TaskDescriptor, injector: Injector, except_list?: any[]): Provider<any>[] {
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
