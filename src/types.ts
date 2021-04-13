/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ExtendableContext } from 'koa'
import { Stream } from 'stream'
import { Schedule } from './trigger'

export type LiteContext = ExtendableContext & {
    process_start?: number
}

export type ApiReturnDataType =
    | null
    | undefined
    | boolean
    | number
    | string
    | ApiReturnDataType[]
    | object
    | Stream
    | Buffer

export type HandlerReturnType<R extends ApiReturnDataType> = R | Promise<R>
export type HttpHandler = (params: any, ctx: LiteContext) => HandlerReturnType<any>

export type ApiPath = string | string[]
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface Type<T> extends Function {
    new(...args: any[]): T;
}

export type KeyOfFilterType<T, U> = {
    [K in keyof T]: Exclude<T[K], undefined> extends U ? K : never
}[keyof T]

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
    crontab?: Schedule
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

export type ProviderDef = ValueProviderDef | ClassProviderDef | FactoryProviderDef

export interface ValueProviderDef {
    provide: any
    useValue: any
}

export interface ClassProviderDef {
    provide: any
    useClass: Type<any>
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
    providers?: (ProviderDef | Type<any>)[]
}

export interface ModuleOptions extends ImportsAndProviders {
    routers?: Type<any>[]
    tasks?: Type<any>[]
}

export interface RouterOptions extends ImportsAndProviders {

}

export interface TriggerOptions extends ImportsAndProviders {

}

export interface ComponentOptions {
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
