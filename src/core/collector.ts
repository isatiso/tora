/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClassProvider, Injector } from '../injector'
import { def2Provider } from '../injector/provider'
import { TokenUtils } from '../token'
import { HandlerDescriptor, ImportsAndProviders, Provider, ProviderDef, RouterOptions, TriggerOptions, Type } from '../types'

/**
 * @private
 *
 * 加载模块及其子模块，注册 Provider。
 *
 * @param target
 * @param options
 */
export function makeProviderCollector(target: any, options?: ImportsAndProviders) {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => TokenUtils.ToraModuleProviderCollector.get(md)?.(injector)) ?? []

        const providers: Provider<any>[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef<any> | Type<any>)[], injector) ?? []
        ]

        return { name: target.name, providers, children }
    }
}

/**
 * @private
 *
 * 收集 Tora.ToraRouter 中的所有请求处理函数。
 *
 * @param target
 * @param options
 */
export function makeRouterCollector(target: any, options?: RouterOptions): (injector: Injector) => HandlerDescriptor[] {
    return function(injector: Injector) {
        const instance = new ClassProvider(target, injector).create()
        TokenUtils.Instance.set(target, instance)
        const handlers: HandlerDescriptor[] = TokenUtils.ToraRouterHandlerList.getset(target.prototype, [])
        const router_path = TokenUtils.ToraRouterPath.get(target)!
        handlers?.forEach(item => {
            item.disabled = TokenUtils.DisabledMeta.get(target.prototype, item.property_key)
            item.pos = `${target.name}.${item.property_key}`
            item.path = router_path
            item.handler = item.handler.bind(instance)
        })

        return handlers
    }
}

/**
 * @private
 *
 * 收集 Tora.ToraTrigger 中的所有任务。
 *
 * @param target
 * @param options
 */
export function makeTaskCollector(target: any, options?: TriggerOptions) {
    return function(injector: Injector) {
        const instance = new ClassProvider<typeof target>(target, injector).create()
        TokenUtils.Instance.set(target, instance)
        const tasks = TokenUtils.ToraTriggerTaskList.getset(target, [])
        tasks?.forEach((t: any) => {
            t.handler = t.handler.bind(instance)
            t.pos = `${target.name}.${t.property_key}`
            t.lock = TokenUtils.LockMeta.get(target.prototype, t.property_key)
            t.disabled = TokenUtils.DisabledMeta.get(target.prototype, t.property_key)
        })
        return tasks
    }
}
