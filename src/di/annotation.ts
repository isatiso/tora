import { GenericTypeOfCustomMeta, TokenUtils } from '../token'
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
        const injection = TokenUtils.ParamInjection.getset(proto, key, [])
        injection[index] = token
    }
}

/**
 * @annotation Disabled
 *
 * Mark a method which is no need to load.
 */
export function Disabled(disabled_options?: GenericTypeOfCustomMeta<typeof TokenUtils.DisabledMeta>) {
    return (target: any, key: string) => {
        TokenUtils.DisabledMeta.set(target, key, {})
    }
}

/**
 * @annotation Lock
 *
 * Mark LockMeta to a method.
 */
export function Lock(lock_options?: GenericTypeOfCustomMeta<typeof TokenUtils.LockMeta>) {
    return (target: any, property_key: string) => {
        const { key, expires } = lock_options ?? {}
        TokenUtils.LockMeta.set(target, property_key, { key, expires })
    }
}

/**
 * @annotation EchoDependencies
 *
 * Mark LockMeta to a method.
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
 * @author plankroot
 * @annotation Meta: Set metadata to a target, for share with other annotation. Generally, it has not much difference with @Reflect.defineMetadata.
 *
 * @param meta (T extends object) - any object
 */
export function Meta<T extends object = any>(meta: T) {
    return function(target: any) {
        TokenUtils.ClassMeta.set(target, meta)
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
        const inject_token_map = TokenUtils.ParamInjection.get(target, key)
        return TokenUtils.getParamTypes(target, key)?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
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
                const meta = TokenUtils.ClassMeta.getset(target, {})
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
        TokenUtils.ToraRouterHandlerList.getset(proto, [])?.push(desc)
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
        return TokenUtils.CustomData.get(target)?.[key]
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
        const custom_data = TokenUtils.CustomData.getset(target, {})
        if (!custom_data) {
            return false
        }
        custom_data[key] = value
        return true
    }
}

