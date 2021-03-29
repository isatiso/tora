import { AnnotationTools, ClassProvider, Injector } from './di'
import { DI_TOKEN, TokenUtils } from './token'
import { ApiMethod, HandlerDescriptor, ProviderDef, Type } from './types'

/**
 * @interface RouterOptions
 */
export interface RouterOptions {
    imports?: Array<Type<any>>
    providers?: (ProviderDef | Type<any>)[]
}

function join_path(front: string, rear: string) {
    return [front, rear].filter(i => i).join('/')
}

/**
 * @annotation Router
 *
 * Collect and load router info.
 *
 * @param path(string) - Absolute path of this node.
 * @param options(RouterOptions)
 */
export function Router(path: `/${string}`, options?: RouterOptions) {
    return function(constructor: any) {
        TokenUtils.setClassType(constructor, 'tora_router')
        Reflect.defineMetadata(DI_TOKEN.router_absolute_path, path, constructor)
        Reflect.defineMetadata(DI_TOKEN.router_handler_collector, makeRouterCollector(constructor, options), constructor)
        TokenUtils.setRouterImports(constructor, options?.imports)
        TokenUtils.setRouterProviders(constructor, options?.providers)
        Reflect.defineMetadata(DI_TOKEN.router_options, options, constructor)
        constructor.mount = (new_path: `/${string}`) => {
            Reflect.defineMetadata(DI_TOKEN.router_absolute_path, new_path, constructor)
            return constructor
        }
        constructor.replace = (method: string, new_path: string) => {
            const method_path_map = AnnotationTools.get_set_meta_data(DI_TOKEN.router_method_path, constructor, undefined, {})
            method_path_map[method] = new_path
            return constructor
        }
    }
}

export interface IGunslinger<T> {
    replace<M extends keyof T>(method: M, new_path: string): Type<Omit<T, M>> & IGunslinger<Omit<T, M>>
}

export function Gunslinger<T>() {

    return class Gunslinger {

        static mount(path: `/${string}`): Type<T> & IGunslinger<T> {
            return null as any
        }

        static replace<M extends keyof T>(method: M, new_path: string): Type<Omit<T, M>> & IGunslinger<Omit<T, M>> {
            return null as any
        }
    }
}

export type NoTrailingAndLeadingSlash<T> =
    T extends `/${string}` | `${string}/`
        ? 'NoTrailingAndLeadingSlash' :
        T

function createRequestDecorator(method: ApiMethod) {
    return <T extends string>(router_path?: NoTrailingAndLeadingSlash<T>) => (target: any, key: string, desc: PropertyDescriptor) => {
        const handler: HandlerDescriptor = AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {})
        if (!handler.methods) {
            handler.methods = new Set()
        }
        handler.methods.add(method)
        handler.path = handler.path ?? router_path ?? key
        handler.wrap_result = true
        handler.pos = `${target.name}.${key}`
        handler.property_key = key
        if (!handler.handler) {
            handler.handler = desc.value
        }
        if (!handler.param_types) {
            const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, target, key)
            handler.param_types = Reflect.getMetadata('design:paramtypes', target, key)
                ?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
        }
        const handlers: Array<any> = AnnotationTools.get_set_meta_data(DI_TOKEN.router_handlers, target, undefined, [])
        if (!handlers.includes(handler)) {
            handlers.push(handler)
        }
    }
}

/**
 * @annotation Get
 *
 * Mark a method to handle a GET request.
 */
export const Get = createRequestDecorator('GET')

/**
 * @annotation Post
 *
 * Mark a method to handle a POST request.
 */
export const Post = createRequestDecorator('POST')

/**
 * @annotation Put
 *
 * Mark a method to handle a PUT request.
 */
export const Put = createRequestDecorator('PUT')

/**
 * @annotation Delete
 *
 * Mark a method to handle a DELETE request.
 */
export const Delete = createRequestDecorator('DELETE')

/**
 * @annotation Auth
 *
 * Mark a method which need to authorize client info.
 */
export function Auth() {
    return (target: any, key: string) => {
        const handler: HandlerDescriptor = AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {})
        handler.auth = true
    }
}

/**
 * @annotation NoWrap
 *
 * Mark a method which's result is no need to wrap.
 */
export function NoWrap() {
    return (target: any, key: string) => {
        const handler: HandlerDescriptor = AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {})
        handler.wrap_result = false
    }
}

/**
 * @annotation CacheWith
 *
 * Mark cache prefix and expires of a method's response .
 */
export function CacheWith(prefix: string, expires?: number) {
    return (target: any, key: string) => {
        const handler: HandlerDescriptor = AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {})
        handler.cache_prefix = prefix
        handler.cache_expires = expires
    }
}

/**
 * @annotation NoWrap
 *
 * Mark a method which is no need to load.
 */
export function Disabled() {
    return (target: any, key: string) => {
        const handler: HandlerDescriptor = AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {})
        handler.disabled = true
    }
}

function makeRouterCollector(target: any, options?: RouterOptions) {
    return function(injector: Injector) {
        const instance = new ClassProvider(target, injector).create()
        Reflect.defineMetadata(DI_TOKEN.instance, instance, target)

        const handlers: HandlerDescriptor[] = AnnotationTools.get_set_meta_data(DI_TOKEN.router_handlers, target.prototype, undefined, [])
        const path = Reflect.getMetadata(DI_TOKEN.router_absolute_path, target)

        const method_path_map = AnnotationTools.get_set_meta_data(DI_TOKEN.router_method_path, target, undefined, {})

        handlers?.forEach((item: any) => {
            const item_path = method_path_map[item.property_key] ?? item.path
            Object.assign(item, {
                path: join_path(path, item_path.replace(/(^\/|\/$)/g, '')),
                handler: item.handler.bind(instance)
            })
        })

        return handlers
    }
}

