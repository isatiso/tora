import { DI_TOKEN } from '../token'
import { HandlerDescriptor } from '../types'

export interface LockDescriptor {
    key: string
    expires?: number
}

/**
 * @author plankroot
 * @annotation Inject: Provide a way to inject value by custom token whenever you need to inject with non-class one.
 *
 * @param token (any) - any value, a number, a string or any object.
 */
export function Inject(token: any) {
    return function(proto: any, key: string, index: number) {
        const injection = AnnotationTools.get_set_meta_data(DI_TOKEN.param_injection, proto, key, {})
        injection[index] = token
    }
}

/**
 * @annotation Disabled
 *
 * Mark a method which is no need to load.
 */
export function Disabled() {
    return (target: any, key: string) => {
        Reflect.defineMetadata(DI_TOKEN.disabled, true, target, key)
    }
}

/**
 * @annotation Lock
 *
 * Mark a method which is no need to load.
 */
export function Lock(key: string, expires?: number) {
    return (target: any, key: string) => {
        Reflect.defineMetadata(DI_TOKEN.lock, { key, expires }, target, key)
    }
}

/**
 * @author plankroot
 * @annotation Meta: Set metadata to a target, for share with other annotation. Generally, it has not much difference with @Reflect.defineMetadata.
 *
 * @param meta (T extends object) - any object
 */
export function Meta<T extends object = any>(meta: T) {
    return function(target: any) {
        Reflect.defineMetadata(DI_TOKEN.router_meta, meta, target)
    }
}

/**
 * @author plankroot
 * @namespace AnnotationTools: Contain some helpful tools to create annotation.
 */
export namespace AnnotationTools {

    /**
     * @author plankroot
     * @function get_set_meta_data: get metadata by specified target and key. set a default value if there is no value settled.
     *
     * @param metaKey(string) - Key of metadata.
     * @param target(class) - Target to set metadata.
     * @param key(string) - key to index metadata, can be undefined.
     * @param def(any) - default value, set to value if there is no metadata settled. Usually [] or {}.
     *
     * @return (any) - metadata which is object or array, or some other types.
     */
    export function get_set_meta_data(metaKey: string, target: any, key: string | undefined, def: any) {
        if (!Reflect.hasMetadata(metaKey, target, key!)) {
            Reflect.defineMetadata(metaKey, def, target, key!)
        }
        return Reflect.getMetadata(metaKey, target, key!)
    }

    /**
     * @author plankroot
     * @function get_param_types: get parameter types of a method.
     *
     * @param target(class) - Target to get metadata.
     * @param key(string) - Key to index metadata.
     *
     * @return (Type[]) - array of types
     */
    export function get_param_types(target: any, key: string) {
        const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, target, key)
        return Reflect.getMetadata('design:paramtypes', target, key)
            ?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
    }

    /**
     * @author plankroot
     * @function create_decorator: Create class decorator to do something when loading class.
     *
     * @param processor(Function) - function to do something.
     *
     * @return (Function) - a decorator function.
     */
    export function create_decorator<T>(processor: (target: any, meta: any, options?: T) => void) {
        return function(options?: T) {
            return function(target: any) {
                const meta = get_set_meta_data(DI_TOKEN.router_meta, target, undefined, {})
                processor(target, meta, options)
            }
        }
    }

    /**
     * @author plankroot
     * @function add_handler: Add a function to handler set of class.
     *
     * @param proto(prototype) - prototype of class
     * @param desc(HandlerDescriptor): a object to describe handler
     *
     * @return (void)
     */
    export function add_handler(proto: any, desc: HandlerDescriptor) {
        get_set_meta_data(DI_TOKEN.router_handlers, proto, undefined, [])?.push(desc)
    }

    /**
     * @author plankroot
     * @function get_custom_data: Get custom data of specified target.
     *
     * @param target(any) - any object.
     * @param key(string) - key to index metadata.
     *
     * @return (any) - custom data.
     */
    export function get_custom_data<T>(target: any, key: string): T | undefined {
        return Reflect.getMetadata(DI_TOKEN.custom_data, target)?.[key]
    }

    /**
     * @author plankroot
     * @function define_custom_data: Set custom data of specified target.
     *
     * @param target(any) - any object.
     * @param key(string) - key to index metadata.
     * @param value(any) - custom data to set.
     *
     * @return (boolean) - true if set successfully.
     */
    export function define_custom_data<T = any>(target: any, key: string, value: T) {
        const custom_data = get_set_meta_data(DI_TOKEN.custom_data, target, undefined, {})
        if (!custom_data) {
            return false
        }
        custom_data[key] = value
        return true
    }
}

