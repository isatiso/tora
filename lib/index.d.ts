/// <reference types="node" />
import { ExtendableContext } from 'koa';
import { Stream } from 'stream';

declare type LiteContext = ExtendableContext & {
    process_start?: number;
};
declare type ApiReturnDataType = null | undefined | boolean | number | string | ApiReturnDataType[] | object | Stream | Buffer;
declare type HandlerReturnType<R extends ApiReturnDataType> = R | Promise<R>;
declare type HttpHandler = (params: any, ctx: LiteContext) => HandlerReturnType<any>;
declare type ApiPath = string | string[];
declare type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

declare type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
declare type ClassType = 'tora_router' | 'tora_module';
interface Type<T> extends Function {
    new (...args: any[]): T;
}
declare type KeyOfFilterType<T, U> = {
    [K in keyof T]: Exclude<T[K], undefined> extends U ? K : never;
}[keyof T];
interface HandlerDescriptor {
    path: string;
    methods: Set<HttpMethod>;
    handler?: any;
    param_types?: any[];
    inject_except_list?: any[];
    auth?: 'admin' | 'client';
    wrap_result?: boolean;
    cache_prefix?: string;
    cache_expires?: number;
    disabled?: boolean;
    pos: string;
}
declare type ProviderDef = ValueProviderDef | ClassProviderDef | FactoryProviderDef;
interface ValueProviderDef {
    provide: any;
    useValue: any;
}
interface ClassProviderDef {
    provide: any;
    useClass: Type<any>;
    multi?: boolean;
}
interface FactoryProviderDef {
    provide: any;
    useFactory: Function;
    deps?: any[];
}
interface Provider<T> {
    name: string;
    set_used(parents?: any[]): void;
    create(...args: any[]): T;
}

declare abstract class Authenticator<USER> {
    abstract load_token(ctx: LiteContext): this;
    abstract auth(): Promise<USER | undefined>;
    abstract get_user_info(): USER | undefined;
}

declare abstract class CacheProxy {
    abstract set_cache_options(options: {
        cache_expires: number;
        cache_prefix: string;
    }): void;
    abstract clear(key: string): Promise<number>;
    abstract get(key?: string): Promise<any | null>;
    abstract set(value: any): Promise<void>;
}

declare class SessionContext<USER extends object = any> {
    private ctx;
    private auth;
    private cache?;
    constructor(ctx: LiteContext, auth: Authenticator<USER>, cache?: CacheProxy | undefined, cache_prefix?: string, cache_expires?: number);
    get url(): string | undefined;
    get method(): string | undefined;
    get path(): string;
    get real_ip(): string;
    get rawBody(): string;
    get query(): any;
    get user(): USER;
    get maybe_user(): USER | undefined;
    header(key: string): any;
    headers(): any;
    response_header(key: string, value: string | number): void;
    do_auth(): Promise<USER | undefined>;
    redirect(url: string, alt?: string): never;
    finish(data: any): never;
    clear_cache(key: string): Promise<number | undefined>;
    return_if_cache(key?: string): Promise<null>;
    finish_and_cache<T>(info_promise: Promise<T> | T): Promise<T>;
    finish_and_cache<T>(info_promise: Promise<T> | T, also_return: true): Promise<never>;
}

declare type ValueType = 'exist' | 'function' | 'object' | 'array' | 'nonEmptyArray' | 'null' | 'nonNull' | 'string' | 'nonEmptyString' | 'number' | 'nonZeroNumber' | 'boolean' | 'true' | 'false';
declare const PURE_PARAMS = "PURE_PARAMS";
declare class Reference<T> {
    data: T;
    constructor(data: T);
    get<P extends keyof T>(prop: P): T[P] | undefined;
    get<P extends keyof T>(prop: P, def: T[P]): Exclude<T[P], undefined>;
}
declare class Judgement<T> extends Reference<T> {
    protected testValue(value: any, type?: ValueType | RegExp): any;
    protected any(value: any, types: (ValueType | RegExp)[]): boolean;
    protected all(value: any, types: (ValueType | RegExp)[]): boolean;
}
declare class ApiParams<T> extends Judgement<T> {
    getIf<P extends keyof T>(prop: P, match: ValueType | RegExp): T[P] | undefined;
    getIf<P extends keyof T>(prop: P, match: ValueType | RegExp, def: T[P]): T[P];
    getIfAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P] | undefined;
    getIfAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], def: T[P]): T[P];
    getIfAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P] | undefined;
    getIfAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], def: T[P]): T[P];
    ensureAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P];
    ensureAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P];
    ensure<P extends keyof T>(prop: P, match?: ValueType | RegExp): T[P];
    diveDeepOrUndefined<P extends KeyOfFilterType<T, object>>(prop: P): ApiParams<T[P]> | undefined;
    diveDeep<P extends KeyOfFilterType<T, object>>(prop: P): ApiParams<T[P]>;
    doIfAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], then?: (res: T[P]) => void): void;
    doIfAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], then?: (res: T[P]) => void): void;
    doIf<P extends keyof T>(prop: P, match: ValueType | RegExp, then?: (res: T[P]) => void): void;
}

declare class ToraServer {
    private handlers;
    get_handler_list(need_handler?: boolean): {
        method: ApiMethod;
        path: string;
        handler?: HttpHandler | undefined;
    }[];
    on<T, R extends ApiReturnDataType>(method: ApiMethod, path: ApiPath, handler: (params: T, ctx: LiteContext) => HandlerReturnType<R>): void;
    handleRequest(context: LiteContext, next: Function): Promise<any>;
    private set_handler;
}

declare class SessionData<T extends object = any> {
    private _custom_data;
    set(key: keyof T, value: T[typeof key]): void;
    get(key: keyof T): T[typeof key] | undefined;
}

declare abstract class LifeCycle {
    abstract on_init(cs: SessionContext, data: SessionData): Promise<void>;
    abstract on_finish(cs: SessionContext, data: SessionData): Promise<void>;
    abstract on_error(cs: SessionContext, data: SessionData, err: any): Promise<void>;
}

declare class _NullInjector {
    get(token: any, info?: string): void;
}
declare const NullInjector: _NullInjector;
declare type InjectorType = Injector | _NullInjector;
declare class InjectorProvider implements Provider<Injector> {
    name: string;
    private readonly value;
    used: boolean;
    constructor(name: string, value: Injector);
    create(): Injector;
    set_used(): void;
}
declare class Injector {
    private parent;
    providers: Map<any, any>;
    provider?: InjectorProvider;
    constructor(parent: InjectorType, providers?: Map<any, any>);
    static create(parent?: InjectorType | null, providers?: Map<any, any>): Injector;
    set_provider(token: any, provider: Provider<any>): void;
    get(token: any, info?: string): Provider<any>;
}

declare class ClassProvider<M> implements Provider<M> {
    private cls;
    injector: Injector;
    private readonly multi?;
    resolved?: M;
    name: string;
    used: boolean;
    constructor(cls: Type<M>, injector: Injector, multi?: boolean | undefined);
    create(parents?: any[]): M;
    set_used(parents?: any[]): void;
    private get_param_instance;
    private set_param_instance_used;
    private extract_param_types;
}
declare class ValueProvider<M> implements Provider<M> {
    name: string;
    private readonly value;
    used: boolean;
    constructor(name: string, value: M);
    create(): M;
    set_used(): void;
}
declare class FactoryProvider<M> implements Provider<M> {
    name: string;
    private factory;
    private deps?;
    used: boolean;
    constructor(name: string, factory: (...args: any[]) => M, deps?: any[] | undefined);
    create(): M;
    set_used(): void;
}

declare function Inject(token: any): (proto: any, key: string, index: number) => void;
declare function Meta<T extends object = any>(meta: T): (target: any) => void;
declare namespace AnnotationTools {
    function get_set_meta_data(metaKey: string, target: any, key: string | undefined, def: any): any;
    function get_param_types(target: any, key: string): any;
    function create_decorator<T>(processor: (target: any, meta: any, options?: T) => void): (options?: T | undefined) => (target: any) => void;
    function add_handler(proto: any, desc: HandlerDescriptor): void;
    function get_custom_data<T>(target: any, key: string): T | undefined;
    function define_custom_data<T = any>(target: any, key: string, value: T): boolean;
}

declare class UUID extends String {
    private _id;
    valueOf(): string;
    toString(): string;
}

declare class CurrentTimestamp extends Number {
    private _timestamp;
    valueOf(): number;
}

declare class ReasonableError extends Error {
    readonly code: number;
    readonly msg: string;
    readonly detail?: any;
    constructor(code: number, msg: string, detail?: any);
    toJson(): {
        code: number;
        msg: string;
        detail: any;
    };
}
declare function reasonable(code: number, msg: string, detail?: any): ReasonableError;
declare function throw_reasonable(code: number, msg: string, detail?: any): never;
declare function crash(msg: any): never;
declare function response<C extends LiteContext>(ctx: C, data: any): never;

interface ToraModuleDef {
    imports?: Array<Type<any>>;
    providers?: (ProviderDef | Type<any>)[];
    router_gate?: Type<any>;
}
declare function ToraModule(options?: ToraModuleDef): (target: any) => void;

declare function Component(echo_dependencies?: boolean): (target: any) => void;

interface RouterOptions {
    children?: any[];
}
declare function Router(path: string, options?: RouterOptions): (target: any) => void;
declare const Get: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
declare const Post: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
declare const Put: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
declare const Delete: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
declare function Auth(auth_target?: 'admin' | 'client'): (target: any, key: string) => void;
declare function NoWrap(): (target: any, key: string) => void;
declare function CacheWith(prefix: string, expires?: number): (target: any, key: string) => void;
declare function Disabled(): (target: any, key: string) => void;

declare class Platform {
    private readonly started_at;
    private modules;
    private root_injector;
    private _server;
    private _koa;
    constructor();
    loading_message(port: number): this;
    register_module(name: string, module: any): this;
    select_module(keys: string[]): this;
    bootstrap(root_module: any): this;
    koa_use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void): this;
    show_api_list(): this;
    start(port: number): void;
    private get_providers;
}
declare class ErrorWrapper<T> {
    readonly err: T;
    readonly err_data: any;
    readonly err_type: 'reasonable' | 'crash';
    constructor(err: T);
}
declare type ToraError<T> = ErrorWrapper<T>;

export { AnnotationTools, ApiMethod, ApiParams, ApiPath, ApiReturnDataType, Auth, Authenticator, CacheProxy, CacheWith, ClassProvider, ClassProviderDef, ClassType, Component, CurrentTimestamp, Delete, Disabled, FactoryProvider, FactoryProviderDef, Get, HandlerDescriptor, HandlerReturnType, HttpHandler, HttpMethod, Inject, Injector, InjectorType, Judgement, KeyOfFilterType, LifeCycle, LiteContext, Meta, NoWrap, NullInjector, PURE_PARAMS, Platform, Post, Provider, ProviderDef, Put, Router, RouterOptions, SessionContext, SessionData, ToraError, ToraModule, ToraModuleDef, ToraServer, Type, UUID, ValueProvider, ValueProviderDef, ValueType, crash, reasonable, response, throw_reasonable };
