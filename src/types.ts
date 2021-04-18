/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.

 * @module
 * @category Namespace
 */

import { ExtendableContext } from 'koa'
import { Stream } from 'stream'
import { Schedule } from './schedule'

declare global {

    /**
     * 通过全局声明合并扩展 ToraConfigSchema。
     *
     * [[include:builtin/config-data.md]]
     *
     * @category ConfigSchema
     */
    interface ToraConfigSchema {
        tora?: {
            port?: number
        }
    }

    interface ToraSession {

    }

    interface ToraAuthInfo {

    }
}

/**
 * Koa 支持的响应体类型。
 *
 * [[include:types/koa-response-type.md]]
 */
export type KoaResponseType = string | Buffer | Stream | Object | Array<any> | null

export interface Type<T> extends Function {
    new(...args: any[]): T;
}

export type LiteContext = ExtendableContext & {
    process_start?: number
}

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type ApiPath = string | string[]
export type HandlerReturnType<R extends KoaResponseType> = R | Promise<R>
export type HttpHandler = (params: any, ctx: LiteContext) => HandlerReturnType<any>

export interface HandlerDescriptor {
    path?: string
    method_and_path?: { [prop: string]: [ApiMethod, string] }
    handler?: any
    param_types?: any[]
    inject_except_list?: any[]
    auth?: boolean
    wrap_result?: boolean
    cache_prefix?: string
    cache_expires?: number
    disabled?: {}
    pos?: string
    property_key?: string
}

export interface TaskDescriptor {
    schedule?: Schedule
    crontab?: string
    lock?: {
        key: string
        expires?: number
    }
    disabled?: boolean
    handler?: any
    param_types?: any[]
    property_key?: string
    inject_except_list?: any[]
    pos?: string
}

export type ProviderDef<T> = ValueProviderDef | ClassProviderDef<T> | FactoryProviderDef

export interface ValueProviderDef {
    provide: any
    useValue: any
}

export interface ClassProviderDef<T> {
    provide: T
    useClass: Type<T>
    multi?: boolean
}

export interface FactoryProviderDef {
    provide: any
    useFactory: Function
    deps?: any[]
}

export interface Provider<T> {
    name: string

    set_used(parents?: any[]): void

    create(...args: any[]): T
}

export interface ImportsAndProviders {
    imports?: Array<Type<any>>
    providers?: (ProviderDef<any> | Type<any>)[]
}

export interface ToraModuleOptions extends ImportsAndProviders {
    routers?: Type<any>[]
    tasks?: Type<any>[]
}

export interface ToraRouterOptions extends ImportsAndProviders {

}

export interface ToraTriggerOptions extends ImportsAndProviders {

}

export interface ToraServiceOptions {
    echo_dependencies?: boolean
}

/**
 * @interface ProviderTreeNode
 */
export interface ProviderTreeNode {
    name: string
    providers: any[]
    children: ProviderTreeNode[]
}

/**
 * @private
 *
 * 参考 [[Get]] [[Post]] [[Put]] [[Delete]]。
 *
 * @category Router Extend
 */
export type NoTrailingAndLeadingSlash<T> =
    T extends `/${string}` | `${string}/`
        ? 'NoTrailingAndLeadingSlash' :
        T

/**
 * @private
 *
 * GunsLinger Type, see {@link Gunslinger}.
 *
 * @category Router Extend
 */
export interface IGunslinger<T> {

    new(): Type<T>

    mount(path: `/${string}`): Type<T> & IGunslinger<T>

    replace<M extends keyof T>(method: M, new_path: string): Type<Omit<T, M>> & IGunslinger<Omit<T, M>>
}
