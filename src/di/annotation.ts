import { DI_TOKEN } from '../token'
import { HandlerDescriptor } from '../types'

export function Inject(token: any) {
    return function(proto: any, key: string, index: number) {
        const injection = AnnotationTools.get_set_meta_data(DI_TOKEN.param_injection, proto, key, {})
        injection[index] = token
    }
}

export function Meta<T extends object = any>(meta: T) {
    return function(target: any) {
        Reflect.defineMetadata(DI_TOKEN.router_meta, meta, target)
    }
}

export namespace AnnotationTools {

    export function get_set_meta_data(metaKey: string, target: any, key: string | undefined, def: any) {
        if (!Reflect.hasMetadata(metaKey, target, key!)) {
            Reflect.defineMetadata(metaKey, def, target, key!)
        }
        return Reflect.getMetadata(metaKey, target, key!)
    }

    export function get_param_types(target: any, key: string) {
        const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, target, key)
        return Reflect.getMetadata('design:paramtypes', target, key)
            ?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
    }

    export function create_decorator<T>(processor: (target: any, meta: any, options?: T) => void) {
        return function(options?: T) {
            return function(target: any) {
                const meta = get_set_meta_data(DI_TOKEN.router_meta, target, undefined, {})
                processor(target, meta, options)
            }
        }
    }

    export function add_handler(proto: any, desc: HandlerDescriptor) {
        get_set_meta_data(DI_TOKEN.router_handlers, proto, undefined, [])?.push(desc)
    }

    export function get_custom_data<T>(target: any, key: string): T | undefined {
        return Reflect.getMetadata(DI_TOKEN.custom_data, target)?.[key]
    }

    export function define_custom_data<T = any>(target: any, key: string, value: T) {
        const custom_data = get_set_meta_data(DI_TOKEN.custom_data, target, undefined, {})
        if (!custom_data) {
            return false
        }
        custom_data[key] = value
        return true
    }
}

