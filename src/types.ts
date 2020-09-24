import { ExtendableContext } from 'koa'
import { Stream } from 'stream'

export type LiteContext = ExtendableContext & {
    process_start?: number
}

export type ApiReturnDataType =
    null
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

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type ClassType = 'tora_router' | 'tora_module'

export interface HandlerDescriptor {
    path: string
    methods: Set<HttpMethod>
    handler?: any
    param_types?: any[]
    inject_except_list?: any[]
    auth?: 'admin' | 'client'
    wrap_result?: boolean
    cache_prefix?: string
    cache_expires?: number
    disabled?: boolean
    pos: string
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
