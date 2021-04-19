/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Schedule, ScheduleOptions } from '../schedule'
import { GenericTypeOfCustomMeta, TokenUtils } from '../token'
import { ToraServiceOptions, ToraModuleOptions, NoTrailingAndLeadingSlash, ToraRouterOptions, TaskDescriptor, ToraTriggerOptions } from '../types'
import { makeProviderCollector, makeRouterCollector, makeTaskCollector } from './collector'
import { _Delete, _Get, _Post, _Put } from './request'

/**
 * 把一个类标记为 Tora.ToraModule，并提供配置元数据。
 *
 * [[include:core/tora-module.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraModule(options?: ToraModuleOptions) {
    return function(target: any) {
        TokenUtils.setComponentTypeNX(target, 'ToraModule')
        TokenUtils.ToraModuleProviderCollector.set(target, makeProviderCollector(target, options))
        TokenUtils.ToraModuleRouters.set(target, options?.routers)
        TokenUtils.ToraModuleTasks.set(target, options?.tasks)
    }
}

/**
 * 把一个类标记为 Tora.ToraService。
 *
 * [[include:core/tora-service.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraService(options?: ToraServiceOptions) {
    return function(target: any) {
        TokenUtils.setComponentTypeNX(target, 'ToraService')
        TokenUtils.ToraServiceName.set(target, target.name)
    }
}

/**
 * 把一个类标记为 Tora.ToraRouter，并配置元数据。
 *
 * [[include:core/tora-router.md]]
 *
 * @category Tora Core
 * @param path
 * @param options
 */
export function ToraRouter(path: `/${string}`, options?: ToraRouterOptions) {
    return function(constructor: any) {

        TokenUtils.setComponentTypeNX(constructor, 'ToraRouter')
        TokenUtils.ToraRouterPath.set(constructor, path)
        TokenUtils.ToraRouterOptions.set(constructor, options)
        TokenUtils.ToraRouterHandlerCollector.set(constructor, makeRouterCollector(constructor, options))
        TokenUtils.ToraModuleProviderCollector.set(constructor, makeProviderCollector(constructor, options))

        constructor.mount = (new_path: `/${string}`) => {
            TokenUtils.ToraRouterPath.set(constructor, new_path)
            return constructor
        }

        constructor.replace = (router_method_name: string, new_path: string) => {
            TokenUtils.ToraRouterPathReplacement.getset(constructor, {})[router_method_name] = new_path
            return constructor
        }
    }
}

/**
 * 把一个类标记为 Tora.ToraTrigger，并配置元数据。
 *
 * [[include:core/tora-trigger.md]]
 *
 * @category Tora Core
 * @param options
 */
export function ToraTrigger(options?: ToraTriggerOptions) {
    return function(constructor: any) {
        TokenUtils.setComponentTypeNX(constructor, 'ToraTrigger')
        TokenUtils.ToraTriggerOptions.set(constructor, options)
        TokenUtils.ToraTriggerTaskCollector.set(constructor, makeTaskCollector(constructor, options))
        TokenUtils.ToraModuleProviderCollector.set(constructor, makeProviderCollector(constructor, options))
    }
}

/**
 * 将 Tora.ToraRouter 中的一个请求处理函数标记为需要进行授权。
 *
 * @category Router Modifier
 */
export function Auth() {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.auth = true
    }
}

/**
 * 将 Tora.ToraRouter 中的一个请求处理函数标记为结果不需要进行 wrap 操作。
 *
 * @category Router Modifier
 */
export function NoWrap() {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.wrap_result = false
    }
}

/**
 * 将 Tora.ToraRouter 中的一个请求处理函数标记为结果需要进行缓存。
 *
 * @category Router Modifier
 */
export function CacheWith(prefix?: string, expires?: number) {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.cache_prefix = prefix
        handler.cache_expires = expires
    }
}

/**
 * 将 Tora.ToraTrigger 中的一个方法标记为一个任务。
 *
 * @category Trigger Annotation
 *
 * @param crontab 任务计划
 * @param options
 * @constructor
 */
export function Task(crontab: string, options?: ScheduleOptions) {
    return function(target: any, key: string, desc: PropertyDescriptor) {

        if (TokenUtils.ToraTriggerTask.has(target, key)) {
            throw new Error(`Decorator @Task duplicated on method ${key}.`)
        }

        const task: TaskDescriptor = {}
        task.crontab = crontab
        task.name = options?.name
        task.schedule = Schedule.parse(crontab, options)
        task.property_key = key
        task.handler = desc.value
        const inject_token_map = TokenUtils.ParamInjection.get(target, key)
        task.param_types = TokenUtils.getParamTypes(target, key)
            ?.map((t: any, i: number) => inject_token_map?.[i] ?? t)

        TokenUtils.ToraTriggerTask.set(target, key, task)

        const tasks = TokenUtils.ToraTriggerTaskList.getset(target, [])
        if (!tasks.includes(task)) {
            tasks.push(task)
        }
    }
}

/**
 * 将 Tora.ToraTrigger 中的一个任务标记为需要上锁。
 * 通过实现 TaskLock 并注入服务来实现任务的锁机制。
 *
 * [[include:core/lock.md]]
 *
 * @category Trigger Annotation
 * @param lock_options
 */
export function Lock(lock_options?: GenericTypeOfCustomMeta<typeof TokenUtils.LockMeta>) {
    return (target: any, property_key: string) => {
        const { key, expires } = lock_options ?? {}
        TokenUtils.LockMeta.set(target, property_key, { key, expires })
    }
}

/**
 * 当你需要使用 Class 和 Enum 以外的值进行依赖查找时，可以使用此装饰器。
 *
 * 比如使用一些特殊的字符串。
 *
 * > 在 typescript 中实现依赖注入时，用来查找依赖项的 token 需要满足条件：[即是值，又是类型](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#basic-concepts)。
 * >
 * > 在当前的 typescript 版本中（< 4.2.3），满足这个条件的概念只有 Class 和 Enum。
 * >
 * > 要使用其他的值表示类型单纯通过 reflect-metadata 就做不到了。`@Inject` 就是一种辅助实现方式。
 *
 * [[include:di/inject.md]]
 *
 * @category Common Annotation
 * @param token - 任何可以通过 === 进行相等判断的值。一般会选择具有某些含义的字符串。
 */
export function Inject(token: any) {
    return function(proto: any, key: string, index: number) {
        const injection = TokenUtils.ParamInjection.getset(proto, key, [])
        injection[index] = token
    }
}

/**
 * 用于标记一个 Class 或者 Class 中的一个方法为无效的。
 *
 * 目前支持这个装饰器的位置只有 ToraRouter 中标记了 @Get，@Post 等装饰器的方法。
 * 无效化的是将该函数添加进处理函数列表的操作。
 *
 * [[include:di/disabled.md]]
 *
 * @category Common Annotation
 * @param disabled_options 目前没有可用的选项内容，后续可能会添加一些。
 */
export function Disabled(disabled_options?: GenericTypeOfCustomMeta<typeof TokenUtils.DisabledMeta>) {
    return (target: any, key?: string) => {
        disabled_options = disabled_options ?? {}
        TokenUtils.DisabledMeta.set(target, key, disabled_options)
    }
}

/**
 * 这是一个调试用的装饰器。
 * 在一个 Tora 组件上使用 `@EchoDependencies` 会在加载组件时将入参类型打印到控制台。
 * 这里的类型是指在被 Inject 装饰器替换之前的。
 *
 * **注意**：由于在执行方法装饰器时无法拿到类名，所以使用 `EchoDependencies` 输出方法参数时，必须在 class 上同时使用。单独使用在方法上的 `EchoDependencies` 不会输出任何内容。
 *
 * [[include:di/echo-dependencies.md]]
 *
 * @category Common Annotation
 */
export function EchoDependencies() {
    return function(target: any, property_key?: string) {
        if (property_key === undefined) {
            console.log(`${target.name} dependencies`, TokenUtils.getParamTypes(target))
            const dependencies = TokenUtils.Dependencies.getset(target.prototype, {})
            Object.keys(dependencies).forEach(property_key => {
                console.log(`${target.name}.${property_key} dependencies`, dependencies[property_key])
            })
        } else {
            const dependencies = TokenUtils.Dependencies.getset(target, {})
            dependencies[property_key] = TokenUtils.getParamTypes(target, property_key)
        }
    }
}

/**
 * 向 Class 标记一些自定义元信息，在自定义装饰器工具 `AnnotationTools` 中会很有用。
 *
 * 使用方式参考 [[AnnotationTools.create_decorator]]
 *
 * @category Common Annotation
 */
export function Meta<T extends object = any>(meta: T) {
    return function(target: any) {
        TokenUtils.ClassMeta.set(target, meta)
    }
}


/**
 * 将 Tora.ToraRouter 中的一个方法标记为 GET 请求处理函数。
 *
 * @category Router Request
 */
export function Get<T extends string>(path_tail?: NoTrailingAndLeadingSlash<T>) {
    return _Get(path_tail)
}

/**
 * 将 Tora.ToraRouter 中的一个方法标记为 POST 请求处理函数。
 *
 * @category Router Request
 */
export function Post<T extends string>(path_tail?: NoTrailingAndLeadingSlash<T>) {
    return _Post(path_tail)
}

/**
 * 将 Tora.ToraRouter 中的一个方法标记为 PUT 请求处理函数。
 *
 * @category Router Request
 */
export function Put<T extends string>(path_tail?: NoTrailingAndLeadingSlash<T>) {
    return _Put(path_tail)
}

/**
 * 将 Tora.ToraRouter 中的一个方法标记为 DELETE 请求处理函数。
 *
 * @category Router Request
 */
export function Delete<T extends string>(path_tail?: NoTrailingAndLeadingSlash<T>) {
    return _Delete(path_tail)
}

