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
interface Type<T> extends Function {
    new (...args: any[]): T;
}
declare type KeyOfFilterType<T, U> = {
    [K in keyof T]: Exclude<T[K], undefined> extends U ? K : never;
}[keyof T];
declare type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
declare type ClassType = 'tora_router' | 'tora_module';
interface HandlerDescriptor {
    path: string;
    methods: Set<HttpMethod>;
    handler?: any;
    param_types?: any[];
    inject_except_list?: any[];
    auth?: boolean;
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

/**
 * @abstract Authenticator
 */
declare abstract class Authenticator<USER> {
    abstract load_token(ctx: LiteContext): this;
    abstract auth(): Promise<USER | undefined>;
    abstract get_user_info(): USER | undefined;
}

/**
 * @abstract CacheProxy
 */
declare abstract class CacheProxy {
    abstract set_cache_options(options: {
        cache_expires: number;
        cache_prefix: string;
    }): void;
    abstract clear(key: string): Promise<number>;
    abstract get(key?: string): Promise<any | null>;
    abstract set(value: any): Promise<void>;
}

/**
 * @author plankroot
 * @class
 * @name SessionContext
 * @description Request session context for data transform.
 */
declare class SessionContext<USER extends object = any> {
    private ctx;
    private auth;
    private cache?;
    constructor(ctx: LiteContext, auth: Authenticator<USER>, cache?: CacheProxy | undefined, cache_prefix?: string, cache_expires?: number);
    /**
     * @return url of request, include query string.
     */
    get url(): string | undefined;
    /**
     * @return method of request.
     */
    get method(): string | undefined;
    /**
     * @return url of request, exclude query string.
     */
    get path(): string;
    /**
     * @return ip address of request, from header X-Real-Ip or X-Forward-For or remote-address.
     */
    get real_ip(): string;
    /**
     * @return raw string of request body.
     */
    get rawBody(): string;
    /**
     * @return query object which parsed from query string.
     */
    get query(): any;
    /**
     * @return user info, if user info is not exist, throw a 401 Unauthorized Error.
     */
    get user(): USER;
    /**
     * @return user info, if user info is not exist, return undefined.
     */
    get maybe_user(): USER | undefined;
    /**
     * @function Get header of specified key.
     * @param key(string) - eg. Content-Type
     */
    header(key: string): any;
    /**
     * @function Get all headers as a dict.
     */
    headers(): any;
    /**
     * @function Set header of response.
     * @param key(string) - eg. Content-Type.
     * @param value(string | number) - eg. application/json.
     */
    response_header(key: string, value: string | number): void;
    /**
     * @function check authorization of client info, like cookie things, depends on implementation.
     *
     * @return (USER) user info or undefined.
     */
    do_auth(): Promise<USER | undefined>;
    /**
     * @function Perform a 302 redirect to `url`.
     *
     * The string "back" is special-cased
     * to provide Referrer support, when Referrer
     * is not present `alt` or "/" is used.
     *
     * @example:
     *    this.redirect('back');
     *    this.redirect('back', '/index.html');
     *    this.redirect('/login');
     *    this.redirect('http://google.com');
     */
    redirect(url: string, alt?: string): never;
    /**
     * @function Finish process of handler and go next.
     * @param data: result of process.
     */
    finish(data: any): never;
    /**
     * @function Clear cache of response of specified key.
     * @param key(string)
     */
    clear_cache(key: string): Promise<number | undefined>;
    /**
     * @function
     *
     * Search exist cache data. and store the key.
     *
     * @param key(string)
     */
    return_if_cache(key?: string): Promise<null>;
    /**
     * @function
     *
     * Cache data with key which save in ServerContext.return_if_cache and finish.
     *
     * @param info_promise
     */
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

/**
 * Class to save and pass data in a single session.
 */
declare class SessionData<T extends object = any> {
    private _custom_data;
    set(key: keyof T, value: T[typeof key]): void;
    get(key: keyof T): T[typeof key] | undefined;
}

/**
 * @abstract LifeCycle
 */
declare abstract class LifeCycle {
    abstract on_init(cs: SessionContext, data: SessionData): Promise<void>;
    abstract on_finish(cs: SessionContext, data: SessionData): Promise<void>;
    abstract on_error(cs: SessionContext, data: SessionData, err: any): Promise<void>;
}

/**
 * @abstract ResultWrapper
 */
declare abstract class ResultWrapper {
    abstract wrap(result: any): object;
}

declare class _NullInjector {
    get(token: any, info?: string): void;
}
declare const NullInjector: _NullInjector;
declare type InjectorType = Injector | _NullInjector;
/**
 * @author plankroot
 * @class A special provider for injector.
 */
declare class InjectorProvider implements Provider<Injector> {
    name: string;
    private readonly value;
    used: boolean;
    constructor(name: string, value: Injector);
    create(): Injector;
    set_used(): void;
}
/**
 * @author plankroot
 * Injector
 */
declare class Injector {
    private parent;
    providers: Map<any, any>;
    provider?: InjectorProvider;
    constructor(parent: InjectorType, providers?: Map<any, any>);
    /**
     * @author plankroot
     * @function Injector#create - create a injector.
     *
     * @param parent(InjectorType) - Injector or NullInjector
     * @param providers(Map) - Providers
     */
    static create(parent?: InjectorType | null, providers?: Map<any, any>): Injector;
    /**
     * @author plankroot
     * @function Injector.set_provider: record a token - provider mapping relation.
     *
     * @param token(any): value to index provider.
     * @param provider(any): provider for a token.
     */
    set_provider(token: any, provider: Provider<any>): void;
    /**
     * @author plankroot
     * @function Injector.get: get a provider from injector.
     * @param token: value to index provider.
     * @param info: debug info, usually is a string to show who or where call this method.
     */
    get(token: any, info?: string): Provider<any>;
}

/**
 * @author plankroot
 * ClassProvider: wrap a class, and create instance when needed.
 */
declare class ClassProvider<M> implements Provider<M> {
    private cls;
    injector: Injector;
    private readonly multi?;
    resolved?: M;
    name: string;
    used: boolean;
    constructor(cls: Type<M>, injector: Injector, multi?: boolean | undefined);
    /**
     * @author plankroot
     * @function create instance of this.cls and of its dependence if needed.
     *
     * @param parents: record calling path.
     *
     * @return Provider.
     */
    create(parents?: any[]): M;
    /**
     * @author plankroot
     * @function mark used of provider recursively
     * @param parents
     */
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
    /**
     * @function mark used of provider.
     */
    set_used(): void;
}

/**
 * @author plankroot
 * @annotation Inject: Provide a way to inject value by custom token whenever you need to inject with non-class one.
 *
 * @param token (any) - any value, a number, a string or any object.
 */
declare function Inject(token: any): (proto: any, key: string, index: number) => void;
/**
 * @author plankroot
 * @annotation Meta: Set metadata to a target, for share with other annotation. Generally, it has not much difference with @Reflect.defineMetadata.
 *
 * @param meta (T extends object) - any object
 */
declare function Meta<T extends object = any>(meta: T): (target: any) => void;
/**
 * @author plankroot
 * @namespace AnnotationTools: Contain some helpful tools to create annotation.
 */
declare namespace AnnotationTools {
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
    function get_set_meta_data(metaKey: string, target: any, key: string | undefined, def: any): any;
    /**
     * @author plankroot
     * @function get_param_types: get parameter types of a method.
     *
     * @param target(class) - Target to get metadata.
     * @param key(string) - Key to index metadata.
     *
     * @return (Type[]) - array of types
     */
    function get_param_types(target: any, key: string): any;
    /**
     * @author plankroot
     * @function create_decorator: Create class decorator to do something when loading class.
     *
     * @param processor(Function) - function to do something.
     *
     * @return (Function) - a decorator function.
     */
    function create_decorator<T>(processor: (target: any, meta: any, options?: T) => void): (options?: T | undefined) => (target: any) => void;
    /**
     * @author plankroot
     * @function add_handler: Add a function to handler set of class.
     *
     * @param proto(prototype) - prototype of class
     * @param desc(HandlerDescriptor): a object to describe handler
     *
     * @return (void)
     */
    function add_handler(proto: any, desc: HandlerDescriptor): void;
    /**
     * @author plankroot
     * @function get_custom_data: Get custom data of specified target.
     *
     * @param target(any) - any object.
     * @param key(string) - key to index metadata.
     *
     * @return (any) - custom data.
     */
    function get_custom_data<T>(target: any, key: string): T | undefined;
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
    function define_custom_data<T = any>(target: any, key: string, value: T): boolean;
}

/**
 * @author plankroot
 * @class Generate a uuid as 32bytes char sequence.
 *
 * @example
 * class TestRouter {
 *
 *     @Post()
 *     async test(
 *         id: UUID
 *     ) {
 *
 *         return { id }
 *     }
 * }
 */
declare class UUID extends String {
    private _id;
    valueOf(): string;
    toString(): string;
}

/**
 * @author plankroot
 * @class Generate a unix-timestamp in milliseconds.
 *
 * @example
 * class TestRouter {
 *
 *     @Post()
 *     async test(
 *         now: CurrentTimestamp
 *     ) {
 *
 *         return {
 *             timestamp: now
 *         }
 *     }
 * }
 */
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

/**
 * @interface ToraModuleDef
 */
interface ToraModuleDef {
    imports?: Array<Type<any>>;
    providers?: (ProviderDef | Type<any>)[];
    router_gate?: Type<any>;
}
/**
 * @annotation ToraModule
 *
 * Dependency injector core. Collect and assemble provider in this annotation.
 *
 * @param options(ToraModuleDef)
 */
declare function ToraModule(options?: ToraModuleDef): (target: any) => void;

/**
 * @annotation Component
 *
 * Mark for Reflect to resolve types of this class and constructor parameters.
 *
 * @param echo_dependencies: debug option, show dependencies of this class.
 */
declare function Component(echo_dependencies?: boolean): (target: any) => void;

/**
 * @interface RouterOptions
 */
interface RouterOptions {
    children?: any[];
}
/**
 * @annotation Router
 *
 * Collect and load router info.
 *
 * @param path(string) - Path of this node. Finally join all the path in one branch.
 * @param options(RouterOptions)
 */
declare function Router(path: string, options?: RouterOptions): (target: any) => void;
/**
 * @annotation Get
 *
 * Mark a method to handle a GET request.
 */
declare const Get: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
/**
 * @annotation Post
 *
 * Mark a method to handle a POST request.
 */
declare const Post: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
/**
 * @annotation Put
 *
 * Mark a method to handle a PUT request.
 */
declare const Put: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
/**
 * @annotation Delete
 *
 * Mark a method to handle a DELETE request.
 */
declare const Delete: (router_path?: string | undefined) => (target: any, key: string, desc: PropertyDescriptor) => void;
/**
 * @annotation Auth
 *
 * Mark a method which need to authorize client info.
 */
declare function Auth(): (target: any, key: string) => void;
/**
 * @annotation NoWrap
 *
 * Mark a method which's result is no need to wrap.
 */
declare function NoWrap(): (target: any, key: string) => void;
/**
 * @annotation CacheWith
 *
 * Mark cache prefix and expires of a method's response .
 */
declare function CacheWith(prefix: string, expires?: number): (target: any, key: string) => void;
/**
 * @annotation NoWrap
 *
 * Mark a method which is no need to load.
 */
declare function Disabled(): (target: any, key: string) => void;

/**
 * Platform of Tora, where is a place of actual execution.
 */
declare class Platform {
    private readonly started_at;
    private modules;
    private root_injector;
    private _server;
    private _koa;
    constructor();
    /**
     * @function
     *
     * Print message before loading platform.
     *
     * @param port(number) - port to listen.
     */
    loading_message(port: number): this;
    /**
     * @function
     *
     * Register module for Platform.select_module.
     *
     * @param name(string) - module name
     * @param module(ToraModule) - module object
     */
    register_module(name: string, module: any): this;
    /**
     * @function
     *
     * Select registered module to bootstrap.
     *
     * Usually prepare a lot of module by Platform.register_module.
     * Then select some of them by command args.
     *
     * @param keys(string[]) - a list of module name
     */
    select_module(keys: string[]): this;
    /**
     * @function
     *
     * Bootstrap module directly.
     *
     * @param root_module(ToraModule) - module to load.
     */
    bootstrap(root_module: any): this;
    /**
     * @function
     *
     * Expose of Koa.use
     *
     * @param middleware
     */
    koa_use(middleware: (ctx: LiteContext, next: () => Promise<any>) => void): this;
    /**
     * @function
     *
     * Print all handler to stdout.
     */
    show_api_list(): this;
    /**
     * @function
     *
     * Start listening of server.
     *
     * @param port
     */
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

export { AnnotationTools, ApiMethod, ApiParams, ApiPath, ApiReturnDataType, Auth, Authenticator, CacheProxy, CacheWith, ClassProvider, ClassProviderDef, ClassType, Component, CurrentTimestamp, Delete, Disabled, FactoryProvider, FactoryProviderDef, Get, HandlerDescriptor, HandlerReturnType, HttpHandler, HttpMethod, Inject, Injector, InjectorType, Judgement, KeyOfFilterType, LifeCycle, LiteContext, Meta, NoWrap, NullInjector, PURE_PARAMS, Platform, Post, Provider, ProviderDef, Put, ResultWrapper, Router, RouterOptions, SessionContext, SessionData, ToraError, ToraModule, ToraModuleDef, ToraServer, Type, UUID, ValueProvider, ValueProviderDef, ValueType, crash, reasonable, response, throw_reasonable };
