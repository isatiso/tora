export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ClassType = 'fm_router' | 'fm_module'

export interface Type<T> extends Function {
    new(...args: any[]): T;
}

export type KeyOfFilterType<T, U> = {
    [K in keyof T]: Exclude<T[K], undefined> extends U ? K : never
}[keyof T]

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
