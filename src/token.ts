/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'reflect-metadata'
import { Injector } from './injector'
import { HandlerDescriptor, Provider, TaskDescriptor, ToraRouterOptions, ToraTriggerOptions, Type } from './types'

/**
 *
 */
export type GenericTypeOfCustomMeta<T> = T extends MetaTool<infer P> ? P : never

/**
 * @private
 * 用于通过反射存取数据的 metadataKey 集合。
 */
enum DI_TOKEN {

    // user custom metadata
    custom_data = 'lazor:custom_data',
    class_meta = 'lazor:class_meta',

    // inner metadata
    class_type = 'lazor:class_type',
    dependencies = 'lazor:dependencies',
    disabled_meta = 'lazor:disabled_meta',
    instance = 'lazor:instance',
    lock_meta = 'lazor:lock_meta',
    param_injection = 'lazor:param_injection',

    // ToraService
    tora_service_name = 'lazor:tora_service_name',

    // ToraModule
    tora_module_provider_collector = 'lazor:tora_module_provider_collector',
    tora_module_routers = 'lazor:tora_module_routers',
    tora_module_tasks = 'lazor:tora_module_tasks',

    // ToraTrigger
    tora_trigger_options = 'lazor:tora_trigger_options',
    tora_trigger_task = 'lazor:tora_trigger_task',
    tora_trigger_task_collector = 'lazor:tora_trigger_task_collector',
    tora_trigger_task_list = 'lazor:tora_trigger_task_list',

    // ToraRouter
    tora_router_absolute_path = 'lazor:tora_router_absolute_path',
    tora_router_handler = 'lazor:tora_router_handler',
    tora_router_handler_collector = 'lazor:tora_router_handler_collector',
    tora_router_handler_list = 'lazor:tora_router_handler_list',
    tora_router_options = 'lazor:tora_router_options',
    tora_router_path_replacement = 'lazor:tora_router_path_replacement',
}

/**
 * @private
 * 通过 reflect-metadata 存取元数据的工具。
 */
export class MetaTool<T = any> {

    constructor(
        private metadataKey: string
    ) {
    }

    /**
     * 获取元数据。
     *
     * @param target
     * @param property_key
     */
    get(target: any, property_key?: string): T | undefined {
        if (property_key === undefined) {
            return Reflect.getMetadata(this.metadataKey, target)
        } else {
            return Reflect.getMetadata(this.metadataKey, target, property_key)
        }
    }

    /**
     * 是否存在指定元数据。
     * @param target
     * @param property_key
     */
    has(target: any, property_key?: string): boolean {
        if (property_key === undefined) {
            return Reflect.hasMetadata(this.metadataKey, target)
        } else {
            return Reflect.hasMetadata(this.metadataKey, target, property_key)
        }
    }

    /**
     * 获取元数据，如果不存在则设置一个默认值并返回。
     *
     * @param target
     * @param default_value
     */
    getset(target: any, default_value: T): T
    /**
     * 获取元数据，如果不存在则设置一个默认值并返回。
     *
     * @param target
     * @param property_key
     * @param default_value
     */
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

    /**
     * 设置元数据。
     *
     * @param target
     * @param options
     */
    set(target: any, options: T): void
    /**
     * 设置元数据。
     *
     * @param target
     * @param property_key
     * @param options
     */
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

    /**
     * 如果元数据不存在则设置元数据，如果已经存在则抛出异常。
     *
     * @param target
     * @param options
     */
    setnx(target: any, options: T): void
    /**
     * 如果元数据不存在则设置元数据，如果已经存在则抛出异常。
     *
     * @param target
     * @param property_key
     * @param options
     */
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

    /**
     * 检查指定元数据是否存在，不存在则抛出异常。
     *
     * @param target
     * @param property_key
     */
    ensure(target: any, property_key: string | undefined) {
        if (this.get(target, property_key) === undefined) {
            throw new Error(`Metadata "${this.metadataKey}" not exists.`)
        }
    }

    /**
     * 删除指定元数据。
     *
     * @param target
     * @param property_key
     */
    del(target: any, property_key?: string): void {
        if (property_key === undefined) {
            Reflect.deleteMetadata(this.metadataKey, target)
        } else {
            Reflect.deleteMetadata(this.metadataKey, target, property_key)
        }
    }
}

/**
 * Reflect Metadata 工具集。
 *
 * @category Namespace
 */
export namespace TokenUtils {

    /**
     * ComponentType
     * @category Type
     */
    export type ComponentType = 'ToraRouter' | 'ToraModule' | 'ToraTrigger' | 'ToraService'

    /**
     * Tora 组件类型。
     * @category Basic Meta
     */
    export const ComponentType = new MetaTool<ComponentType>(DI_TOKEN.class_type)

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const CustomData = new MetaTool<{ [prop: string]: any }>(DI_TOKEN.custom_data)

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const ClassMeta = new MetaTool<{ [prop: string]: any }>(DI_TOKEN.class_meta)

    /**
     * 参数类型。
     * @category Basic Meta
     */
    export const Dependencies = new MetaTool<{ [property: string]: Type<any>[] }>(DI_TOKEN.dependencies)

    /**
     * 禁用相关信息。
     * @category Basic Meta
     */
    export const DisabledMeta = new MetaTool<{}>(DI_TOKEN.disabled_meta)

    /**
     * 锁相关信息。
     * @category Basic Meta
     */
    export const LockMeta = new MetaTool<{ key?: string, expires?: number }>(DI_TOKEN.lock_meta)

    /**
     * 存储实例。
     * @category Basic Meta
     */
    export const Instance = new MetaTool<any>(DI_TOKEN.instance)

    /**
     * 特殊注入 token 列表。
     * @category Basic Meta
     */
    export const ParamInjection = new MetaTool<any[]>(DI_TOKEN.param_injection)

    /**
     * ToraService 名称。
     * @category Tora Service Meta
     */
    export const ToraServiceName = new MetaTool<string>(DI_TOKEN.tora_service_name)

    // ToraModule

    /**
     * ToraModule 收集函数。
     * @category Tora Module Meta
     */
    export const ToraModuleProviderCollector = new MetaTool<(injector: Injector) => { children: any[], name: any, providers: Provider<any>[] }>(DI_TOKEN.tora_module_provider_collector)

    /**
     * ToraModule 的 routers，对应 ToraModuleOptions 中的 routers。
     * @category Tora Module Meta
     */
    export const ToraModuleRouters = new MetaTool<Type<any>[] | undefined>(DI_TOKEN.tora_module_routers)

    /**
     * ToraModule 的 tasks，对应 ToraModuleOptions 中的 tasks。
     * @category Tora Module Meta
     */
    export const ToraModuleTasks = new MetaTool<Type<any>[] | undefined>(DI_TOKEN.tora_module_tasks)

    // ToraRouter

    /**
     * ToraRouter 的处理函数。
     * @category Tora Router Meta
     */
    export const ToraRouterHandler = new MetaTool<HandlerDescriptor>(DI_TOKEN.tora_router_handler)

    /**
     * ToraRouter Handler 收集函数。
     * @category Tora Router Meta
     */
    export const ToraRouterHandlerCollector = new MetaTool<(injector: Injector) => HandlerDescriptor[]>(DI_TOKEN.tora_router_handler_collector)

    /**
     * 一个 ToraRouter 上全部 Handler 的列表。
     * @category Tora Router Meta
     */
    export const ToraRouterHandlerList = new MetaTool<HandlerDescriptor[]>(DI_TOKEN.tora_router_handler_list)

    /**
     * ToraRouterOptions。
     * @category Tora Router Meta
     */
    export const ToraRouterOptions = new MetaTool<ToraRouterOptions | undefined>(DI_TOKEN.tora_router_options)

    /**
     * ToraRouter 挂载的绝对路径。
     * @category Tora Router Meta
     */
    export const ToraRouterPath = new MetaTool<string>(DI_TOKEN.tora_router_absolute_path)

    /**
     * ToraRouter 路径替换列表。
     * @category Tora Router Meta
     */
    export const ToraRouterPathReplacement = new MetaTool<{ [router_method_key: string]: string }>(DI_TOKEN.tora_router_path_replacement)

    // ToraTrigger

    /**
     * ToraTriggerOptions。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerOptions = new MetaTool<ToraTriggerOptions | undefined>(DI_TOKEN.tora_trigger_options)

    /**
     * ToraTrigger 的任务函数。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerTask = new MetaTool<TaskDescriptor>(DI_TOKEN.tora_trigger_task)

    /**
     * ToraTrigger 的任务收集函数。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerTaskCollector = new MetaTool<(injector: Injector) => TaskDescriptor[]>(DI_TOKEN.tora_trigger_task_collector)

    /**
     * 一个 ToraTrigger 上全部的任务列表。
     * @category Tora Trigger Meta
     */
    export const ToraTriggerTaskList = new MetaTool<TaskDescriptor[]>(DI_TOKEN.tora_trigger_task_list)

    /**
     * 获取指定类或函数的参数列表。
     *
     * @category Reflect Metadata
     * @param target
     * @param property_key
     */
    export function getParamTypes(target: any, property_key?: string): any[] {
        if (property_key === undefined) {
            return Reflect.getMetadata('design:paramtypes', target)
        } else {
            return Reflect.getMetadata('design:paramtypes', target, property_key)
        }
    }

    /**
     * 获取指定目标的类型。
     *
     * @category Reflect Metadata
     * @param target
     * @param property_key
     */
    export function getType(target: any, property_key?: string): any {
        if (property_key === undefined) {
            return Reflect.getMetadata('design:type', target)
        } else {
            return Reflect.getMetadata('design:type', target, property_key)
        }
    }

    /**
     * 当 Tora 组件类型不存在时，添加组件类型，否则抛出异常。
     *
     * @category Basic Meta
     * @param target
     * @param type
     */
    export function setComponentTypeNX(target: any, type: ComponentType) {

        if (TokenUtils.ComponentType.get(target) === type) {
            throw new Error(`Decorator duplicated on class ${target.name}, @${type} can only be used once.`)
        }

        if (TokenUtils.ComponentType.has(target)) {
            throw new Error(`Decorator conflicts on class ${target.name}, only one of @ToraService, @ToraModule, @ToraRouter, @ToraTrigger can be used on same class.`)
        }

        ComponentType.set(target, type)
    }
}
