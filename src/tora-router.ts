import { AnnotationTools, ClassProvider, Injector } from './di'
import { DI_TOKEN, TokenUtils } from './token'
import { ApiMethod, HandlerDescriptor } from './types'

/**
 * @interface RouterOptions
 */
export interface RouterOptions {
    children?: any[]
}

function join_path(front: string, rear: string) {
    return (front + '/' + rear).replace(/^\//, '').replace(/\/$/, '')
}

/**
 * @annotation Router
 *
 * Collect and load router info.
 *
 * @param path(string) - Path of this node. Finally join all the path in one branch.
 * @param options(RouterOptions)
 */
export function Router(path: string, options?: RouterOptions) {
    return function(target: any) {
        TokenUtils.setClassType(target, 'tora_router')
        Reflect.defineMetadata(DI_TOKEN.router_handler_collector, makeRouterCollector(target, path, options), target)
        Reflect.defineMetadata(DI_TOKEN.router_options, options, target)
    }
}

function createRequestDecorator(method: ApiMethod) {
    return (router_path?: string) => (target: any, key: string, desc: PropertyDescriptor) => {
        const handler: HandlerDescriptor = AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {})
        if (!handler.methods) {
            handler.methods = new Set()
        }
        handler.methods.add(method)
        handler.path = handler.path ?? router_path ?? key
        handler.wrap_result = true
        handler.pos = `${target.name}.${key}`
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

function makeRouterCollector(target: any, path: string, options?: RouterOptions) {
    return function(injector: Injector) {
        const instance = new ClassProvider(target, injector).create()
        Reflect.defineMetadata(DI_TOKEN.instance, instance, target)

        const handlers: HandlerDescriptor[] = AnnotationTools.get_set_meta_data(DI_TOKEN.router_handlers, target.prototype, undefined, [])

        handlers?.forEach((item: any) => Object.assign(item, {
            path: join_path(path, item.path),
            handler: item.handler.bind(instance)
        }))

        options?.children?.forEach(r => {
            Reflect.getMetadata(DI_TOKEN.router_handler_collector, r)?.(injector)
                ?.forEach((sr: HandlerDescriptor) => {
                    sr.path = join_path(path, sr.path)
                    handlers.push(sr)
                })
        })

        return handlers
    }
}

