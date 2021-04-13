/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClassProvider, Injector } from './di'
import { TokenUtils } from './token'
import { makeProviderCollector } from './tora-module'
import { ApiMethod, HandlerDescriptor, RouterOptions, Type } from './types'

/**
 * @annotation
 *
 * Mark class as Tora router component, which can be load by Platform instance.
 *
 * e.g.
 * ```typescript
 * @ToraRouter('/test')
 * export class SampleComponent {
 *
 *     constructor(
 *         public sc1: SampleComponent1,
 *         private sc2: SampleComponent2,
 *     ) {
 *     }
 *
 *     @Get('test-get')
 *     async test_get_method() {
 *         return 'OK'
 *     }
 * }
 * ```
 *
 * @category Annotation
 *
 * @param path
 * @param options
 */
export function ToraRouter(path: `/${string}`, options?: RouterOptions) {
    return function(constructor: any) {

        TokenUtils.setClassTypeNX(constructor, 'ToraRouter')
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
 * Alias for {@link ToraRouter}
 *
 * @category Annotation Alias
 */
export const Router = ToraRouter

/**
 * @private
 *
 * GunsLinger Type, see {@link Gunslinger}.
 */
interface IGunslinger<T> {

    new(): Type<T>

    mount(path: `/${string}`): Type<T> & IGunslinger<T>

    replace<M extends keyof T>(method: M, new_path: string): Type<Omit<T, M>> & IGunslinger<Omit<T, M>>
}

/**
 * Class factory, for mixin method to modify path of API.
 * @constructor
 */
export function Gunslinger<T>(): IGunslinger<T> {
    return class {
    } as any
}

export type NoTrailingAndLeadingSlash<T> =
    T extends `/${string}` | `${string}/`
        ? 'NoTrailingAndLeadingSlash' :
        T

function createRequestDecorator(method: ApiMethod) {
    return <T extends string>(path_tail?: NoTrailingAndLeadingSlash<T>) => (target: any, key: string, desc: PropertyDescriptor) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})

        // Mark handle function.
        if (!handler.property_key) {
            handler.property_key = key
            handler.handler = desc.value
            const inject_token_map = TokenUtils.ParamInjection.get(target, key)
            handler.param_types = TokenUtils.getParamTypes(target, key)?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
            const handlers = TokenUtils.ToraRouterHandlerList.getset(target, [])
            if (!handlers.includes(handler)) {
                handlers.push(handler)
            }
        }

        // Mark handler function if need to wrap result.
        if (handler.wrap_result === undefined) {
            handler.wrap_result = true
        }

        // Mark API tail path with HTTP method.
        if (!handler.method_and_path) {
            handler.method_and_path = {}
        }
        const method_path = path_tail ?? key as string
        handler.method_and_path[`${method}-${method_path}`] = [method, method_path]
    }
}

/**
 * Mark a method to handle a GET request.
 *
 * @category Annotation
 */
export const Get = createRequestDecorator('GET')

/**
 * Mark a method to handle a POST request.
 *
 * @category Annotation
 */
export const Post = createRequestDecorator('POST')

/**
 * Mark a method to handle a PUT request.
 *
 * @category Annotation
 */
export const Put = createRequestDecorator('PUT')

/**
 * Mark a method to handle a DELETE request.
 *
 * @category Annotation
 */
export const Delete = createRequestDecorator('DELETE')

/**
 * Mark a method which need to authorize client info.
 *
 * @category Annotation
 */
export function Auth() {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.auth = true
    }
}

/**
 * Mark a method which's result is no need to wrap.
 *
 * @category Annotation
 */
export function NoWrap() {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.wrap_result = false
    }
}

/**
 * Mark cache prefix and expires of a method's response .
 *
 * @category Annotation
 */
export function CacheWith(prefix: string, expires?: number) {
    return (target: any, key: string) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})
        handler.cache_prefix = prefix
        handler.cache_expires = expires
    }
}

function makeRouterCollector(target: any, options?: RouterOptions): (injector: Injector) => HandlerDescriptor[] {
    return function(injector: Injector) {
        const instance = new ClassProvider(target, injector).create()
        TokenUtils.Instance.set(target, instance)
        const handlers: HandlerDescriptor[] = TokenUtils.ToraRouterHandlerList.getset(target.prototype, [])
        const path = TokenUtils.ToraRouterPath.get(target)!
        const replacement = TokenUtils.ToraRouterPathReplacement.getset(target, {})
        handlers?.forEach(item => {
            const disabled = TokenUtils.DisabledMeta.get(target.prototype, item.property_key)
            const item_path = replacement[item.property_key ?? ''] ?? item.path
            item.disabled = disabled
            item.pos = `${target.name}.${item.property_key}`
            item.path = path
            item.handler = item.handler.bind(instance)
        })

        return handlers
    }
}

