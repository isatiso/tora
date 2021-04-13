/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { GenericTypeOfCustomMeta, TokenUtils } from '../token'
import { HandlerDescriptor } from '../types'

/**
 * Provide a way to inject value by custom token whenever you need to inject with non-class one.
 *
 * @category Annotation
 * @param token - any value, a number, a string or any object.
 */
export function Inject(token: any) {
    return function(proto: any, key: string, index: number) {
        const injection = TokenUtils.ParamInjection.getset(proto, key, [])
        injection[index] = token
    }
}

/**
 * Mark a method which is no need to load.
 *
 * @category Annotation
 * @param disabled_options Options, not used yet.
 */
export function Disabled(disabled_options?: GenericTypeOfCustomMeta<typeof TokenUtils.DisabledMeta>) {
    return (target: any, key: string) => {
        disabled_options = disabled_options ?? {}
        TokenUtils.DisabledMeta.set(target, key, disabled_options)
    }
}

/**
 * Mark LockMeta to a method.
 *
 * @category Annotation
 * @param lock_options Lock options.
 */
export function Lock(lock_options?: GenericTypeOfCustomMeta<typeof TokenUtils.LockMeta>) {
    return (target: any, property_key: string) => {
        const { key, expires } = lock_options ?? {}
        TokenUtils.LockMeta.set(target, property_key, { key, expires })
    }
}

/**
 * Mark a class or method to echo dependencies when loading.
 *
 * **Note**: It's a debug option, don't use it in production environment.
 *
 * @category Annotation
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
 * Contain some helpful tools to create annotation.
 */
export namespace AnnotationTools {

    /**
     * Get parameter types of a method.
     *
     * @param target - Target to get metadata.
     * @param property_key - Key to index metadata.
     * @return - array of types
     */
    export function get_param_types(target: any, property_key: string) {
        const inject_token_map = TokenUtils.ParamInjection.get(target, property_key)
        return TokenUtils.getParamTypes(target, property_key)?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
    }

    /**
     * Create class decorator to do something when loading class.
     *
     * @param processor - function to do something.
     * @return - a decorator function.
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
     * Add handle function to set of class prototype.
     *
     * @param proto - prototype of class.
     * @param desc: Handler Description.
     * @return - void
     */
    export function add_handler(proto: any, desc: HandlerDescriptor): void {
        TokenUtils.ToraRouterHandlerList.getset(proto, [])?.push(desc)
    }

    /**
     * Get custom data of specified target.
     *
     * @param target - target of metadata.
     * @param index
     * @return - custom data.
     */
    export function get_custom_data<T>(target: any, index: string): T | undefined {
        return TokenUtils.CustomData.get(target)?.[index]
    }

    /**
     * Set custom data of specified target.
     *
     * @param target - target of metadata.
     * @param index
     * @param data
     * @return
     */
    export function define_custom_data<T = any>(target: any, index: string, data: T) {
        TokenUtils.CustomData.getset(target, {})[index] = data
    }
}

