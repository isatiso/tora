/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injector } from './di'
import { HandlerDescriptor, Provider, RouterOptions, TaskDescriptor, TriggerOptions, Type } from './types'

export type GenericTypeOfCustomMeta<T> = T extends CustomMeta<infer P> ? P : never
export type ClassType = 'ToraRouter' | 'ToraModule' | 'ToraTrigger' | 'ToraComponent'

enum DI_TOKEN {

    // user custom metadata
    custom_data = 'lazor:custom-data',
    class_meta = 'lazor:class-meta',

    // inner metadata
    class_type = 'lazor:class_type',
    dependencies = 'lazor:dependencies',
    disabled_meta = 'lazor:disabled_meta',
    instance = 'lazor:instance',
    lock_meta = 'lazor:lock_meta',
    param_injection = 'lazor:param_injection',

    // component
    tora_component = 'lazor:tora_component',

    // module
    tora_module_provider_collector = 'lazor:tora_module_provider_collector',
    tora_module_routers = 'lazor:tora_module_routers',
    tora_module_tasks = 'lazor:tora_module_tasks',

    // trigger
    tora_trigger_options = 'lazor:tora_trigger_options',
    tora_trigger_task = 'lazor:tora_trigger_task',
    tora_trigger_task_collector = 'lazor:tora_trigger_task_collector',
    tora_trigger_task_list = 'lazor:tora_trigger_task_list',

    // router
    tora_router_absolute_path = 'lazor:tora_router_absolute_path',
    tora_router_handler = 'lazor:tora_router_handler',
    tora_router_handler_collector = 'lazor:tora_router_handler_collector',
    tora_router_handler_list = 'lazor:tora_router_handler_list',
    tora_router_options = 'lazor:tora_router_options',
    tora_router_path_replacement = 'lazor:tora_router_path_replacement',
}

class CustomMeta<T = any> {

    constructor(
        private metadataKey: string
    ) {
    }

    get(target: any, property_key?: string): T | undefined {
        if (property_key === undefined) {
            return Reflect.getMetadata(this.metadataKey, target)
        } else {
            return Reflect.getMetadata(this.metadataKey, target, property_key)
        }
    }

    has(target: any, property_key?: string): boolean {
        if (property_key === undefined) {
            return Reflect.hasMetadata(this.metadataKey, target)
        } else {
            return Reflect.hasMetadata(this.metadataKey, target, property_key)
        }
    }

    getset(target: any, default_value: T): T
    getset(target: any, property_key: string, default_value: T): T
    getset(target: any, property_key?: string | T, default_value?: T): T {
        if (default_value === undefined) {
            default_value = property_key as T
            property_key = undefined
        }
        property_key = property_key as string | undefined
        if (!this.has(target, property_key)) {
            if (property_key === undefined) {
                Reflect.defineMetadata(this.metadataKey, default_value, target)
            } else {
                Reflect.defineMetadata(this.metadataKey, default_value, target, property_key)
            }
        }
        return this.get(target, property_key)!
    }

    set(target: any, options: T): void
    set(target: any, property_key: string | undefined, options: T): void
    set(target: any, property_key: T | string | undefined, options?: T): void {
        if (options === undefined) {
            options = property_key as T
            property_key = undefined
        }
        property_key = property_key as string | undefined
        if (property_key === undefined) {
            Reflect.defineMetadata(this.metadataKey, options, target)
        } else {
            Reflect.defineMetadata(this.metadataKey, options, target, property_key)
        }
    }

    setnx(target: any, options: T): void
    setnx(target: any, property_key: string | undefined, options: T): void
    setnx(target: any, property_key: T | string | undefined, options?: T): void {
        if (options === undefined) {
            options = property_key as T
            property_key = undefined
        }
        property_key = property_key as string | undefined
        if (this.get(target, property_key) !== undefined) {
            throw new Error(`Metadata "${this.metadataKey}" already exists and cannot be set repeatedly`)
        }
        if (property_key === undefined) {
            Reflect.defineMetadata(this.metadataKey, options, target)
        } else {
            Reflect.defineMetadata(this.metadataKey, options, target, property_key)
        }
    }

    ensure(target: any, property_key: string | undefined) {
        if (this.get(target, property_key) === undefined) {
            throw new Error(`Metadata "${this.metadataKey}" not exists.`)
        }
    }

    del(target: any, property_key?: string): void {
        if (property_key === undefined) {
            Reflect.deleteMetadata(this.metadataKey, target)
        } else {
            Reflect.deleteMetadata(this.metadataKey, target, property_key)
        }
    }
}

export namespace TokenUtils {

    export const ClassType = new CustomMeta<ClassType>(DI_TOKEN.class_type)
    export const CustomData = new CustomMeta<{ [prop: string]: any }>(DI_TOKEN.custom_data)
    export const Dependencies = new CustomMeta<{ [property: string]: Type<any>[] }>(DI_TOKEN.dependencies)
    export const DisabledMeta = new CustomMeta<{}>(DI_TOKEN.disabled_meta)
    export const Instance = new CustomMeta<any>(DI_TOKEN.instance)
    export const LockMeta = new CustomMeta<{ key?: string, expires?: number }>(DI_TOKEN.lock_meta)

    export const ParamInjection = new CustomMeta<any[]>(DI_TOKEN.param_injection)
    export const ClassMeta = new CustomMeta<{ [prop: string]: any }>(DI_TOKEN.class_meta)

    // ToraComponent
    export const ToraComponent = new CustomMeta<string>(DI_TOKEN.tora_component)

    // ToraModule
    export const ToraModuleProviderCollector = new CustomMeta<(injector: Injector) => { children: any[], name: any, providers: Provider<any>[] }>(DI_TOKEN.tora_module_provider_collector)
    export const ToraModuleRouters = new CustomMeta<Type<any>[] | undefined>(DI_TOKEN.tora_module_routers)
    export const ToraModuleTasks = new CustomMeta<Type<any>[] | undefined>(DI_TOKEN.tora_module_tasks)

    // ToraRouter
    export const ToraRouterHandler = new CustomMeta<HandlerDescriptor>(DI_TOKEN.tora_router_handler)
    export const ToraRouterHandlerCollector = new CustomMeta<(injector: Injector) => HandlerDescriptor[]>(DI_TOKEN.tora_router_handler_collector)
    export const ToraRouterHandlerList = new CustomMeta<HandlerDescriptor[]>(DI_TOKEN.tora_router_handler_list)
    export const ToraRouterOptions = new CustomMeta<RouterOptions | undefined>(DI_TOKEN.tora_router_options)
    export const ToraRouterPath = new CustomMeta<string>(DI_TOKEN.tora_router_absolute_path)
    export const ToraRouterPathReplacement = new CustomMeta<{ [router_method_key: string]: string }>(DI_TOKEN.tora_router_path_replacement)

    // ToraTrigger
    export const ToraTriggerOptions = new CustomMeta<TriggerOptions | undefined>(DI_TOKEN.tora_trigger_options)
    export const ToraTriggerTask = new CustomMeta<TaskDescriptor>(DI_TOKEN.tora_trigger_task)
    export const ToraTriggerTaskCollector = new CustomMeta<(injector: Injector) => TaskDescriptor[]>(DI_TOKEN.tora_trigger_task_collector)
    export const ToraTriggerTaskList = new CustomMeta<TaskDescriptor[]>(DI_TOKEN.tora_trigger_task_list)

    export function getParamTypes(target: any, property_key?: string): any[] {
        if (property_key === undefined) {
            return Reflect.getMetadata('design:paramtypes', target)
        } else {
            return Reflect.getMetadata('design:paramtypes', target, property_key)
        }
    }

    export function getType(target: any, property_key?: string): any {
        if (property_key === undefined) {
            return Reflect.getMetadata('design:type', target)
        } else {
            return Reflect.getMetadata('design:type', target, property_key)
        }
    }

    export function setClassTypeNX(target: any, type: ClassType) {

        if (TokenUtils.ClassType.get(target) === type) {
            throw new Error(`Decorator duplicated on class ${target.name}, @${type} can only be used once.`)
        }

        if (TokenUtils.ClassType.has(target)) {
            throw new Error(`Decorator conflicts on class ${target.name}, only one of @ToraComponent, @ToraModule, @ToraRouter, @ToraTrigger can be used on same class.`)
        }

        ClassType.set(target, type)
    }
}
