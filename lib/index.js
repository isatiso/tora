'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var uuid = require('uuid');
require('reflect-metadata');
var parse = require('co-body');
var Koa = require('koa');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var uuid__default = /*#__PURE__*/_interopDefaultLegacy(uuid);
var parse__default = /*#__PURE__*/_interopDefaultLegacy(parse);
var Koa__default = /*#__PURE__*/_interopDefaultLegacy(Koa);

class ReasonableError extends Error {
    constructor(code, msg, detail) {
        super(msg);
        this.code = code;
        this.msg = msg;
        this.detail = detail;
    }
    toJson() {
        return {
            code: this.code,
            msg: this.msg,
            detail: this.detail
        };
    }
}
class InnerFinish extends Error {
    constructor(response_body) {
        super('');
        this.response_body = response_body;
    }
    get body() {
        return this.response_body;
    }
}
class OuterFinish extends Error {
    constructor(_ctx, response_body) {
        super('');
        this._ctx = _ctx;
        this.response_body = response_body;
    }
    get body() {
        return this.response_body;
    }
    get ctx() {
        return this._ctx;
    }
}
function reasonable(code, msg, detail) {
    return new ReasonableError(code, msg, detail);
}
function throw_reasonable(code, msg, detail) {
    throw new ReasonableError(code, msg, detail);
}
function crash(msg) {
    throw new Error(msg);
}
function response(ctx, data) {
    throw new OuterFinish(ctx, data);
}

const PURE_PARAMS = 'PURE_PARAMS';
class Reference {
    constructor(data) {
        this.data = data;
    }
    get(prop, def) {
        var _a;
        return (_a = this.data[prop]) !== null && _a !== void 0 ? _a : def;
    }
}
class Judgement extends Reference {
    testValue(value, type) {
        if (type instanceof RegExp) {
            return typeof value === 'string' && type.test(value);
        }
        switch (type) {
            case 'exist':
                return value !== undefined;
            case 'true':
                return Boolean(value);
            case 'false':
                return !Boolean(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return Object.prototype.toString.call(value) === '[object Object]';
            case 'function':
                return Object.prototype.toString.call(value) === '[object Function]';
            case 'array':
                return Array.isArray(value);
            case 'nonEmptyArray':
                return Array.isArray(value) && value.length;
            case 'string':
                return typeof value === 'string';
            case 'nonEmptyString':
                return typeof value === 'string' && value;
            case 'number':
                return typeof value === 'number';
            case 'nonZeroNumber':
                return typeof value === 'number' && value;
            case 'null':
                return value === null;
            case 'nonNull':
                return value !== null;
            default:
                return value !== undefined;
        }
    }
    any(value, types) {
        for (const type of types) {
            if (this.testValue(value, type)) {
                return true;
            }
        }
        return false;
    }
    all(value, types) {
        for (const type of types) {
            if (!this.testValue(value, type)) {
                return false;
            }
        }
        return true;
    }
}
class ApiParams extends Judgement {
    getIf(prop, match, def) {
        const res = super.get(prop);
        if (res !== undefined && this.testValue(res, match)) {
            return res;
        }
        return def;
    }
    getIfAny(prop, match, def) {
        const res = super.get(prop);
        if (res !== undefined && this.any(res, match)) {
            return res;
        }
        return def;
    }
    getIfAll(prop, match, def) {
        const res = super.get(prop);
        if (res !== undefined && this.all(res, match)) {
            return res;
        }
        return def;
    }
    ensureAny(prop, match) {
        const res = super.get(prop);
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`);
        }
        if (this.any(res, match)) {
            return res;
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`);
    }
    ensureAll(prop, match) {
        const res = super.get(prop);
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`);
        }
        if (this.all(res, match)) {
            return res;
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`);
    }
    ensure(prop, match) {
        match = match || 'exist';
        const res = super.get(prop);
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`);
        }
        if (this.testValue(res, match)) {
            return res;
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`);
    }
    diveDeepOrUndefined(prop) {
        const res = super.get(prop);
        if (res !== undefined && this.testValue(res, 'object')) {
            return new ApiParams(res);
        }
        return undefined;
    }
    diveDeep(prop) {
        const res = super.get(prop);
        if (res !== undefined && this.testValue(res, 'object')) {
            return new ApiParams(res);
        }
        throw_reasonable(400, `"${prop}" not found.`);
    }
    doIfAny(prop, match, then) {
        const res = super.get(prop);
        if (res === undefined) {
            return;
        }
        if (this.any(res, match)) {
            then === null || then === void 0 ? void 0 : then(res);
        }
    }
    doIfAll(prop, match, then) {
        const res = super.get(prop);
        if (res === undefined) {
            return;
        }
        if (this.all(res, match)) {
            then === null || then === void 0 ? void 0 : then(res);
        }
    }
    doIf(prop, match, then) {
        const res = super.get(prop);
        if (res === undefined) {
            return;
        }
        if (this.testValue(res, match)) {
            then === null || then === void 0 ? void 0 : then(res);
        }
    }
}

class ToraServer {
    constructor() {
        this.handlers = {};
    }
    get_handler_list(need_handler) {
        var _a;
        const list = [];
        for (const path of Object.keys(this.handlers)) {
            for (const method of Object.keys(this.handlers[path]).sort()) {
                if (need_handler) {
                    list.push({ method: method, path, handler: (_a = this.handlers[path]) === null || _a === void 0 ? void 0 : _a[method] });
                }
                else {
                    list.push({ method: method, path });
                }
            }
        }
        return list;
    }
    on(method, path, handler) {
        if (Array.isArray(path)) {
            for (const p of path) {
                this.set_handler(method, p, handler);
            }
        }
        else {
            this.set_handler(method, path, handler);
        }
    }
    handleRequest(context, next) {
        var _a, _b;
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const req = context.request;
            const params = req.method === 'GET' || req.method === 'DELETE' ? req.query : req.body;
            const res = yield ((_b = (_a = this.handlers[req.path]) === null || _a === void 0 ? void 0 : _a[req.method]) === null || _b === void 0 ? void 0 : _b.call(_a, params, context));
            if (res !== undefined) {
                context.response.body = res;
            }
            return next();
        });
    }
    set_handler(method, path, handler) {
        if (!this.handlers[path]) {
            this.handlers[path] = {};
        }
        this.handlers[path][method] = handler;
    }
}

/**
 * @author plankroot
 * @class
 * @name SessionContext
 * @description Request session context for data transform.
 */
class SessionContext {
    constructor(ctx, auth, cache, cache_prefix, cache_expires) {
        var _a, _b;
        this.ctx = ctx;
        this.auth = auth;
        this.cache = cache;
        (_a = this.auth) === null || _a === void 0 ? void 0 : _a.load_token(ctx);
        (_b = this.cache) === null || _b === void 0 ? void 0 : _b.set_cache_options({
            cache_prefix: cache_prefix !== null && cache_prefix !== void 0 ? cache_prefix : this.ctx.path,
            cache_expires: cache_expires !== null && cache_expires !== void 0 ? cache_expires : 3600
        });
    }
    /**
     * @return url of request, include query string.
     */
    get url() {
        return this.ctx.req.url;
    }
    /**
     * @return method of request.
     */
    get method() {
        return this.ctx.req.method;
    }
    /**
     * @return url of request, exclude query string.
     */
    get path() {
        return this.ctx.path;
    }
    /**
     * @return ip address of request, from header X-Real-Ip.
     */
    get real_ip() {
        return this.ctx.request.get('X-Real-IP');
    }
    /**
     * @return raw string of request body.
     */
    get rawBody() {
        return this.ctx.request.rawBody;
    }
    /**
     * @return query object which parsed from query string.
     */
    get query() {
        return this.ctx.query;
    }
    /**
     * @return user info, if user info is not exist, throw a 401 Unauthorized Error.
     */
    get user() {
        var _a, _b;
        return (_b = (_a = this.auth) === null || _a === void 0 ? void 0 : _a.get_user_info()) !== null && _b !== void 0 ? _b : throw_reasonable(401, 'Unauthorized.');
    }
    /**
     * @return user info, if user info is not exist, return undefined.
     */
    get maybe_user() {
        var _a;
        return (_a = this.auth) === null || _a === void 0 ? void 0 : _a.get_user_info();
    }
    header(key) {
        return this.ctx.request.headers[key.toLowerCase()];
    }
    headers() {
        return this.ctx.request.headers;
    }
    response_header(key, value) {
        this.ctx.response.set(key.toLowerCase(), value + '');
    }
    do_auth() {
        var _a;
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return (_a = this.auth) === null || _a === void 0 ? void 0 : _a.auth();
        });
    }
    redirect(url, alt) {
        this.ctx.redirect(url, alt);
        throw new OuterFinish(this.ctx, '');
    }
    finish(data) {
        throw new InnerFinish(data);
    }
    clear_cache(key) {
        var _a;
        return tslib.__awaiter(this, void 0, void 0, function* () {
            return (_a = this.cache) === null || _a === void 0 ? void 0 : _a.clear(key);
        });
    }
    return_if_cache(key) {
        var _a;
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const cache = key && (yield ((_a = this.cache) === null || _a === void 0 ? void 0 : _a.get(key)));
            if (cache) {
                this.finish(cache);
            }
            return null;
        });
    }
    finish_and_cache(info_promise, also_return) {
        var _a;
        return tslib.__awaiter(this, void 0, void 0, function* () {
            const info = yield info_promise;
            yield ((_a = this.cache) === null || _a === void 0 ? void 0 : _a.set(info));
            if (also_return) {
                this.finish(info);
            }
            return Promise.resolve(info);
        });
    }
}

class SessionData {
    constructor() {
        this._custom_data = {};
    }
    set(key, value) {
        this._custom_data[key] = value;
    }
    get(key) {
        return this._custom_data[key];
    }
}

class Authenticator {
}

class CacheProxy {
}

class LifeCycle {
}

class ResultWrapper {
}

var DI_TOKEN;
(function (DI_TOKEN) {
    DI_TOKEN["component"] = "lazor:component";
    DI_TOKEN["cls_type"] = "lazor:class-type";
    DI_TOKEN["custom_data"] = "lazor:custom-data";
    DI_TOKEN["instance"] = "lazor:instance";
    DI_TOKEN["module_provider_collector"] = "lazor:module-provider-collector";
    DI_TOKEN["module_router_gate"] = "lazor:module-router-gate";
    DI_TOKEN["param_injection"] = "lazor:param-injection";
    DI_TOKEN["request_handler"] = "lazor:request-handler";
    DI_TOKEN["router_handler_collector"] = "lazor:router-handler-collector";
    DI_TOKEN["router_handlers"] = "lazor:router-handlers";
    DI_TOKEN["router_options"] = "lazor:router-options";
    DI_TOKEN["router_meta"] = "lazor:router-meta";
})(DI_TOKEN || (DI_TOKEN = {}));
var CLS_TYPE;
(function (CLS_TYPE) {
    CLS_TYPE["tora_module"] = "tora-module";
    CLS_TYPE["tora_router"] = "tora-router";
})(CLS_TYPE || (CLS_TYPE = {}));
var TokenUtils;
(function (TokenUtils) {
    function setClassType(target, type) {
        if (Reflect.getMetadata(DI_TOKEN.cls_type, target)) {
            throw new Error();
        }
        Reflect.defineMetadata(DI_TOKEN.cls_type, type2token(type), target);
    }
    TokenUtils.setClassType = setClassType;
    function ensureClassType(target, type) {
        if (Reflect.getMetadata(DI_TOKEN.cls_type, target) !== type2token(type)) {
            throw new Error(`${target.name} is not a ToraModule.`);
        }
    }
    TokenUtils.ensureClassType = ensureClassType;
    function type2token(type) {
        if (type === 'tora_router') {
            return CLS_TYPE.tora_router;
        }
        else if (type === 'tora_module') {
            return CLS_TYPE.tora_module;
        }
        else {
            throw new Error(`unknown class type ${type}`);
        }
    }
})(TokenUtils || (TokenUtils = {}));

class ClassProvider {
    constructor(cls, injector, multi) {
        var _a;
        this.cls = cls;
        this.injector = injector;
        this.multi = multi;
        this.used = false;
        this.name = cls.name;
        this.multi = (_a = this.multi) !== null && _a !== void 0 ? _a : false;
    }
    create(parents) {
        var _a, _b;
        const exist = (_a = parents === null || parents === void 0 ? void 0 : parents.indexOf(this.cls)) !== null && _a !== void 0 ? _a : -1;
        if (exist >= 0) {
            const circle_path = (_b = parents === null || parents === void 0 ? void 0 : parents.slice(exist)) !== null && _b !== void 0 ? _b : [];
            circle_path.push(this.cls);
            throw new Error('circle dependency: ' + circle_path.map(cls => cls.name).join(' => '));
        }
        parents = (parents !== null && parents !== void 0 ? parents : []).concat(this.cls);
        this.used = true;
        if (this.multi) {
            return this.get_param_instance(parents);
        }
        if (!this.resolved) {
            this.resolved = this.get_param_instance(parents);
        }
        return this.resolved;
    }
    set_used(parents) {
        parents = (parents !== null && parents !== void 0 ? parents : []).concat(this.cls);
        this.used = true;
        this.set_param_instance_used(parents);
    }
    get_param_instance(parents) {
        var _a;
        const provider_list = this.extract_param_types(parents);
        const param_list = (_a = provider_list === null || provider_list === void 0 ? void 0 : provider_list.map((provider) => {
            return provider === null || provider === void 0 ? void 0 : provider.create(parents);
        })) !== null && _a !== void 0 ? _a : [];
        return new this.cls(...param_list);
    }
    set_param_instance_used(parents) {
        var _a;
        (_a = this.extract_param_types(parents)) === null || _a === void 0 ? void 0 : _a.forEach((provider) => provider === null || provider === void 0 ? void 0 : provider.set_used(parents));
    }
    extract_param_types(parents) {
        var _a;
        const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, this.cls);
        return (_a = Reflect.getMetadata('design:paramtypes', this.cls)) === null || _a === void 0 ? void 0 : _a.map((token, i) => {
            var _a, _b;
            const inject_token = inject_token_map === null || inject_token_map === void 0 ? void 0 : inject_token_map[i];
            if (inject_token) {
                token = inject_token;
            }
            if (token === undefined) {
                throw new Error(`type 'undefined' at ${(_a = this.cls) === null || _a === void 0 ? void 0 : _a.name}.constructor[${i}], if it's not specified, there maybe a circular import.`);
            }
            const provider = this.injector.get(token, `${parents === null || parents === void 0 ? void 0 : parents.map(p => p.name).join(' -> ')}`);
            if (provider) {
                return provider;
            }
            throw new Error(`Can't find provider of "${token}" in [${(_b = this.cls) === null || _b === void 0 ? void 0 : _b.name}, constructor, args[${i}]]`);
        });
    }
}
class ValueProvider {
    constructor(name, value) {
        this.name = name;
        this.value = value;
        this.used = false;
    }
    create() {
        this.used = true;
        return this.value;
    }
    set_used() {
        this.used = true;
    }
}
class FactoryProvider {
    constructor(name, factory, deps) {
        this.name = name;
        this.factory = factory;
        this.deps = deps;
        this.used = false;
    }
    create() {
        var _a;
        this.used = true;
        return this.factory(...((_a = this.deps) !== null && _a !== void 0 ? _a : []));
    }
    set_used() {
        this.used = true;
    }
}

function Inject(token) {
    return function (proto, key, index) {
        const injection = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.param_injection, proto, key, {});
        injection[index] = token;
    };
}
function Meta(meta) {
    return function (target) {
        Reflect.defineMetadata(DI_TOKEN.router_meta, meta, target);
    };
}
(function (AnnotationTools) {
    function get_set_meta_data(metaKey, target, key, def) {
        if (!Reflect.hasMetadata(metaKey, target, key)) {
            Reflect.defineMetadata(metaKey, def, target, key);
        }
        return Reflect.getMetadata(metaKey, target, key);
    }
    AnnotationTools.get_set_meta_data = get_set_meta_data;
    function get_param_types(target, key) {
        var _a;
        const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, target, key);
        return (_a = Reflect.getMetadata('design:paramtypes', target, key)) === null || _a === void 0 ? void 0 : _a.map((t, i) => { var _a; return (_a = inject_token_map === null || inject_token_map === void 0 ? void 0 : inject_token_map[i]) !== null && _a !== void 0 ? _a : t; });
    }
    AnnotationTools.get_param_types = get_param_types;
    function create_decorator(processor) {
        return function (options) {
            return function (target) {
                const meta = get_set_meta_data(DI_TOKEN.router_meta, target, undefined, {});
                processor(target, meta, options);
            };
        };
    }
    AnnotationTools.create_decorator = create_decorator;
    function add_handler(proto, desc) {
        var _a;
        (_a = get_set_meta_data(DI_TOKEN.router_handlers, proto, undefined, [])) === null || _a === void 0 ? void 0 : _a.push(desc);
    }
    AnnotationTools.add_handler = add_handler;
    function get_custom_data(target, key) {
        var _a;
        return (_a = Reflect.getMetadata(DI_TOKEN.custom_data, target)) === null || _a === void 0 ? void 0 : _a[key];
    }
    AnnotationTools.get_custom_data = get_custom_data;
    function define_custom_data(target, key, value) {
        const custom_data = get_set_meta_data(DI_TOKEN.custom_data, target, undefined, {});
        if (!custom_data) {
            return false;
        }
        custom_data[key] = value;
        return true;
    }
    AnnotationTools.define_custom_data = define_custom_data;
})(exports.AnnotationTools || (exports.AnnotationTools = {}));

class _NullInjector {
    get(token, info) {
        var _a;
        throw new Error(`Can't find ${(_a = token === null || token === void 0 ? void 0 : token.name) !== null && _a !== void 0 ? _a : token} in NullInjector [${info}]`);
    }
}
const NullInjector = new _NullInjector();
class InjectorProvider {
    constructor(name, value) {
        this.name = name;
        this.value = value;
        this.used = false;
    }
    create() {
        this.used = true;
        return this.value;
    }
    set_used() {
        this.used = true;
    }
}
class Injector {
    constructor(parent, providers = new Map()) {
        this.parent = parent;
        this.providers = providers;
    }
    static create(parent, providers) {
        providers = providers || new Map();
        return new Injector(parent !== null && parent !== void 0 ? parent : NullInjector, providers);
    }
    set_provider(token, provider) {
        this.providers.set(token, provider);
    }
    get(token, info) {
        var _a;
        if (token === Injector) {
            if (!this.provider) {
                this.provider = new InjectorProvider('injector', this);
            }
            return this.provider;
        }
        return (_a = this.providers.get(token)) !== null && _a !== void 0 ? _a : this.parent.get(token, info);
    }
}

function Component(echo_dependencies) {
    return function (target) {
        if (echo_dependencies) {
            console.log('dependencies', Reflect.getMetadata('design:paramtypes', target));
        }
        Reflect.defineMetadata(DI_TOKEN.component, target.name, target);
    };
}

exports.UUID = class UUID extends String {
    constructor() {
        super(...arguments);
        this._id = uuid__default['default'].v1().replace(/-/g, '');
    }
    valueOf() {
        return this._id;
    }
    toString() {
        return this._id;
    }
};
exports.UUID = tslib.__decorate([
    Component()
], exports.UUID);

exports.CurrentTimestamp = class CurrentTimestamp extends Number {
    constructor() {
        super(...arguments);
        this._timestamp = new Date().getTime();
    }
    valueOf() {
        return this._timestamp;
    }
};
exports.CurrentTimestamp = tslib.__decorate([
    Component()
], exports.CurrentTimestamp);

function ToraModule(options) {
    return function (target) {
        TokenUtils.setClassType(target, 'tora_module');
        Reflect.defineMetadata(DI_TOKEN.module_provider_collector, makeProviderCollector(target, options), target);
        if (options === null || options === void 0 ? void 0 : options.router_gate) {
            Reflect.defineMetadata(DI_TOKEN.module_router_gate, options.router_gate, target);
        }
    };
}
function find_usage(tree, indent = 0) {
    var _a, _b;
    return ((_a = tree === null || tree === void 0 ? void 0 : tree.providers) === null || _a === void 0 ? void 0 : _a.find(p => p.used)) || ((_b = tree === null || tree === void 0 ? void 0 : tree.children) === null || _b === void 0 ? void 0 : _b.find(t => find_usage(t, indent + 1)));
}
function makeProviderCollector(target, options) {
    return function (injector) {
        var _a, _b, _c, _d;
        const children = (_a = options === null || options === void 0 ? void 0 : options.imports) === null || _a === void 0 ? void 0 : _a.map(md => { var _a; return (_a = Reflect.getMetadata(DI_TOKEN.module_provider_collector, md)) === null || _a === void 0 ? void 0 : _a(injector); });
        const providers = [
            ...(_d = (_c = def2Provider([...(_b = options === null || options === void 0 ? void 0 : options.providers) !== null && _b !== void 0 ? _b : []], injector)) === null || _c === void 0 ? void 0 : _c.map(item => {
                injector.set_provider(item[0], item[1]);
                return item[1];
            })) !== null && _d !== void 0 ? _d : []
        ];
        return { name: target.name, providers, children };
    };
}
function def2Provider(defs, injector) {
    return defs === null || defs === void 0 ? void 0 : defs.map(def => {
        if (def.useValue) {
            const d = def;
            return [d.provide, new ValueProvider('valueProvider', d.useValue)];
        }
        else if (def.useFactory) {
            const d = def;
            return [d.provide, new FactoryProvider('FactoryProvider', d.useFactory, d.deps),];
        }
        else if (def.useClass) {
            const d = def;
            const isComponent = Reflect.getMetadata(DI_TOKEN.component, d.useClass);
            if (!isComponent) {
                throw new Error(`${d.useClass.name} is not Component.`);
            }
            return [d.provide, new ClassProvider(d.useClass, injector, d.multi)];
        }
        else {
            const isComponent = Reflect.getMetadata(DI_TOKEN.component, def);
            if (!isComponent) {
                throw new Error(`${def.name} is not Component.`);
            }
            return [def, new ClassProvider(def, injector)];
        }
    });
}

function join_path(front, rear) {
    return (front + '/' + rear).replace(/^\//, '').replace(/\/$/, '');
}
function Router(path, options) {
    return function (target) {
        TokenUtils.setClassType(target, 'tora_router');
        Reflect.defineMetadata(DI_TOKEN.router_handler_collector, makeRouterCollector(target, path, options), target);
        Reflect.defineMetadata(DI_TOKEN.router_options, options, target);
    };
}
function createRequestDecorator(method) {
    return (router_path) => (target, key, desc) => {
        var _a, _b, _c;
        const handler = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {});
        if (!handler.methods) {
            handler.methods = new Set();
        }
        handler.methods.add(method);
        handler.path = (_b = (_a = handler.path) !== null && _a !== void 0 ? _a : router_path) !== null && _b !== void 0 ? _b : key;
        handler.wrap_result = true;
        handler.pos = `${target.name}.${key}`;
        if (!handler.handler) {
            handler.handler = desc.value;
        }
        if (!handler.param_types) {
            const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, target, key);
            handler.param_types = (_c = Reflect.getMetadata('design:paramtypes', target, key)) === null || _c === void 0 ? void 0 : _c.map((t, i) => { var _a; return (_a = inject_token_map === null || inject_token_map === void 0 ? void 0 : inject_token_map[i]) !== null && _a !== void 0 ? _a : t; });
        }
        const handlers = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.router_handlers, target, undefined, []);
        if (!handlers.includes(handler)) {
            handlers.push(handler);
        }
    };
}
const Get = createRequestDecorator('GET');
const Post = createRequestDecorator('POST');
const Put = createRequestDecorator('PUT');
const Delete = createRequestDecorator('DELETE');
function Auth(auth_target = 'admin') {
    return (target, key) => {
        const handler = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {});
        handler.auth = auth_target;
    };
}
function NoWrap() {
    return (target, key) => {
        const handler = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {});
        handler.wrap_result = false;
    };
}
function CacheWith(prefix, expires) {
    return (target, key) => {
        const handler = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {});
        handler.cache_prefix = prefix;
        handler.cache_expires = expires;
    };
}
function Disabled() {
    return (target, key) => {
        const handler = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.request_handler, target, key, {});
        handler.disabled = true;
    };
}
function makeRouterCollector(target, path, options) {
    return function (injector) {
        var _a;
        const instance = new ClassProvider(target, injector).create();
        Reflect.defineMetadata(DI_TOKEN.instance, instance, target);
        const handlers = exports.AnnotationTools.get_set_meta_data(DI_TOKEN.router_handlers, target.prototype, undefined, []);
        handlers === null || handlers === void 0 ? void 0 : handlers.forEach((item) => Object.assign(item, {
            path: join_path(path, item.path),
            handler: item.handler.bind(instance)
        }));
        (_a = options === null || options === void 0 ? void 0 : options.children) === null || _a === void 0 ? void 0 : _a.forEach(r => {
            var _a, _b;
            (_b = (_a = Reflect.getMetadata(DI_TOKEN.router_handler_collector, r)) === null || _a === void 0 ? void 0 : _a(injector)) === null || _b === void 0 ? void 0 : _b.forEach((sr) => {
                sr.path = join_path(path, sr.path);
                handlers.push(sr);
            });
        });
        return handlers;
    };
}

let BuiltInModule = class BuiltInModule {
};
BuiltInModule = tslib.__decorate([
    ToraModule({
        providers: [
            { provide: exports.CurrentTimestamp, useClass: exports.CurrentTimestamp, multi: true },
            { provide: exports.UUID, useClass: exports.UUID, multi: true },
        ]
    })
], BuiltInModule);

class ToraKoa {
    constructor(options) {
        this._koa = new Koa__default['default']();
        this._body_parser = new BodyParser();
        this.body_parser = (ctx, next) => tslib.__awaiter(this, void 0, void 0, function* () {
            if (ctx.request.body !== undefined || ctx.disableBodyParser) {
                return yield next();
            }
            try {
                const res = yield this._body_parser.parseBody(ctx);
                ctx.request.body = 'parsed' in res ? res.parsed : {};
                if (ctx.request.rawBody === undefined) {
                    ctx.request.rawBody = res.raw;
                }
            }
            catch (err) {
                ctx.response.status = 400;
                ctx.response.body = 'Bad Request';
                console.log('parse body error', ctx.request.path);
            }
            return yield next();
        });
        this.cors = (ctx, next) => tslib.__awaiter(this, void 0, void 0, function* () {
            ctx.response.res.setHeader('Access-Control-Allow-Origin', '*');
            if (ctx.method === 'OPTIONS') {
                ctx.response.res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Origin,origin,Content-Type,Accept,Authorization');
                ctx.response.res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
                ctx.response.body = '';
            }
            return yield next();
        });
        if (options.cors) {
            this._koa.use(this.cors);
        }
        if (options.body_parser) {
            this._koa.use(this.body_parser);
        }
    }
    use(middleware) {
        this._koa.use(middleware);
    }
    handle_by(server) {
        this._koa.use((ctx, next) => tslib.__awaiter(this, void 0, void 0, function* () { return server.handleRequest(ctx, next); }));
        return this;
    }
    listen(port, cb) {
        this._koa.on('error', (err, ctx) => {
            if (err.code !== 'HPE_INVALID_EOF_STATE') {
                console.log('server error', err, ctx);
                console.log(ctx.request.rawBody);
            }
        }).listen(port, cb);
    }
}
class BodyParser {
    constructor(options) {
        this.jsonTypes = ['application/json', 'application/json-patch+json', 'application/vnd.api+json', 'application/csp-report'];
        this.formTypes = ['application/x-www-form-urlencoded'];
        this.textTypes = ['text/plain', 'text/xml', 'application/xml', 'text/html'];
        this.opts = Object.assign({ returnRawBody: true }, options);
        const enableTypes = this.opts.enableTypes || ['json', 'form', 'text'];
        this.enableForm = enableTypes === null || enableTypes === void 0 ? void 0 : enableTypes.includes('form');
        this.enableJson = enableTypes === null || enableTypes === void 0 ? void 0 : enableTypes.includes('json');
        this.enableText = enableTypes === null || enableTypes === void 0 ? void 0 : enableTypes.includes('text');
    }
    parseBody(ctx) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            if (this.enableJson && ctx.request.is(this.jsonTypes)) {
                return parse__default['default'].json(ctx, this.opts);
            }
            else if (this.enableForm && ctx.request.is(this.formTypes)) {
                return parse__default['default'].form(ctx, this.opts);
            }
            else if (this.enableText && ctx.request.is(this.textTypes)) {
                return parse__default['default'].text(ctx, this.opts).then((v) => v || '');
            }
            else {
                return {};
            }
        });
    }
}

class Platform {
    constructor() {
        var _a;
        this.modules = {};
        this.root_injector = Injector.create();
        this._server = new ToraServer();
        this._koa = new ToraKoa({ cors: true, body_parser: true });
        this.started_at = new Date().getTime();
        this._server.on('GET', '/health-check', () => '');
        this.root_injector.set_provider(Authenticator, new ValueProvider('Authenticator', null));
        this.root_injector.set_provider(CacheProxy, new ValueProvider('CacheProxy', null));
        this.root_injector.set_provider(LifeCycle, new ValueProvider('LifeCycle', null));
        (_a = Reflect.getMetadata(DI_TOKEN.module_provider_collector, BuiltInModule)) === null || _a === void 0 ? void 0 : _a(this.root_injector);
    }
    loading_message(port) {
        console.log(`tora server starting...`);
        console.log(`    listen at port ${port}...`);
        return this;
    }
    register_module(name, module) {
        this.modules[name] = module;
        return this;
    }
    select_module(keys) {
        console.log('selected servers:', keys);
        keys.map(k => this.modules[k])
            .filter(m => m)
            .forEach(m => this.bootstrap(m));
        return this;
    }
    bootstrap(root_module) {
        var _a, _b, _c, _d, _e, _f;
        TokenUtils.ensureClassType(root_module, 'tora_module');
        const sub_injector = Injector.create(this.root_injector);
        const provider_tree = (_a = Reflect.getMetadata(DI_TOKEN.module_provider_collector, root_module)) === null || _a === void 0 ? void 0 : _a(sub_injector);
        (_b = sub_injector.get(Authenticator)) === null || _b === void 0 ? void 0 : _b.set_used();
        (_c = sub_injector.get(LifeCycle)) === null || _c === void 0 ? void 0 : _c.set_used();
        (_d = sub_injector.get(CacheProxy)) === null || _d === void 0 ? void 0 : _d.set_used();
        const router_module = Reflect.getMetadata(DI_TOKEN.module_router_gate, root_module);
        (_f = (_e = Reflect.getMetadata(DI_TOKEN.router_handler_collector, router_module)) === null || _e === void 0 ? void 0 : _e(sub_injector)) === null || _f === void 0 ? void 0 : _f.forEach((desc) => {
            if (!desc.disabled) {
                const provider_list = this.get_providers(desc, sub_injector, [ApiParams, SessionContext, SessionData, PURE_PARAMS]);
                provider_list.forEach(p => { var _a; return (_a = p.create) === null || _a === void 0 ? void 0 : _a.call(p); });
                desc.methods.forEach(m => this._server.on(m, '/' + desc.path, PlatformStatic.makeHandler(sub_injector, desc, provider_list)));
            }
        });
        provider_tree.children.filter(def => !find_usage(def))
            .forEach(def => {
            console.log(`Warning: ${root_module.name} -> ${def.name} not used.`);
        });
        return this;
    }
    koa_use(middleware) {
        this._koa.use(middleware);
        return this;
    }
    show_api_list() {
        const handler_list = this._server.get_handler_list();
        console.log('\nUsable API list:');
        for (const desc of handler_list) {
            console.log(`    ${desc.method.padEnd(7)}`, desc.path);
        }
        return this;
    }
    start(port) {
        this._koa.handle_by(this._server)
            .listen(port, () => {
            const duration = new Date().getTime() - this.started_at;
            console.log(`\ntora server started successfully in ${duration / 1000}s.`);
        });
    }
    get_providers(desc, injector, except_list) {
        var _a, _b;
        return (_b = (_a = desc.param_types) === null || _a === void 0 ? void 0 : _a.map((token, i) => {
            var _a;
            if (token === undefined) {
                throw new Error(`type 'undefined' at ${desc.pos}[${i}], if it's not specified, there maybe a circular import.`);
            }
            if ((except_list === null || except_list === void 0 ? void 0 : except_list.includes(token)) || ((_a = desc.inject_except_list) === null || _a === void 0 ? void 0 : _a.includes(token))) {
                return token;
            }
            else {
                const provider = injector.get(token, desc.pos);
                if (provider) {
                    return provider;
                }
            }
            throw new Error(`Can't find provider of "${token}" in [${desc.pos}, args[${i}]]`);
        })) !== null && _b !== void 0 ? _b : [];
    }
}
var PlatformStatic;
(function (PlatformStatic) {
    function finish_process(ctx, r) {
        ctx.response.body = r;
    }
    PlatformStatic.finish_process = finish_process;
    function run_handler(cs, handler_wrapper) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
            try {
                return yield (handler_wrapper === null || handler_wrapper === void 0 ? void 0 : handler_wrapper());
            }
            catch (reason) {
                if (reason instanceof InnerFinish) {
                    return yield reason.body;
                }
                else if (reason instanceof OuterFinish) {
                    return reason;
                }
                else {
                    return new ErrorWrapper(reason);
                }
            }
        });
    }
    PlatformStatic.run_handler = run_handler;
    function makeHandler(injector, desc, provider_list) {
        return function (params, cs) {
            var _a, _b, _c, _d, _e;
            return tslib.__awaiter(this, void 0, void 0, function* () {
                const cache = (_a = injector.get(CacheProxy)) === null || _a === void 0 ? void 0 : _a.create();
                const result_wrapper = (_b = injector.get(ResultWrapper)) === null || _b === void 0 ? void 0 : _b.create();
                const hooks = (_c = injector.get(LifeCycle)) === null || _c === void 0 ? void 0 : _c.create();
                const auth = (_d = injector.get(Authenticator)) === null || _d === void 0 ? void 0 : _d.create();
                const data = new SessionData();
                const context = new SessionContext(cs, auth, cache, desc.cache_prefix, desc.cache_expires);
                yield (hooks === null || hooks === void 0 ? void 0 : hooks.on_init(context, data));
                if (desc.auth) {
                    if (!auth) {
                        throw new Error(`no provider for <Authenticator>.`);
                    }
                    if ((yield context.do_auth()) === undefined) {
                        finish_process(cs, { error: { code: 401, msg: 'Unauthorized.' } });
                    }
                }
                const param_list = provider_list.map((provider) => {
                    if (provider === undefined) {
                        return undefined;
                    }
                    else if (provider === PURE_PARAMS) {
                        return params;
                    }
                    else if (provider === ApiParams) {
                        return new ApiParams(params);
                    }
                    else if (provider === SessionContext) {
                        return context;
                    }
                    else if (provider === SessionData) {
                        return data;
                    }
                    else {
                        return provider.create();
                    }
                });
                const res = yield run_handler(cs, () => desc.handler(...param_list));
                if (res instanceof ErrorWrapper) {
                    yield (hooks === null || hooks === void 0 ? void 0 : hooks.on_error(context, data, res));
                    finish_process(cs, { error: res.err_data });
                }
                else if (res instanceof OuterFinish) {
                    yield (hooks === null || hooks === void 0 ? void 0 : hooks.on_finish(context, data));
                    finish_process(cs, res.body);
                }
                else {
                    yield (hooks === null || hooks === void 0 ? void 0 : hooks.on_finish(context, data));
                    const real_result = desc.wrap_result ? (_e = result_wrapper === null || result_wrapper === void 0 ? void 0 : result_wrapper.wrap(res)) !== null && _e !== void 0 ? _e : res : res;
                    finish_process(cs, real_result);
                }
            });
        };
    }
    PlatformStatic.makeHandler = makeHandler;
})(PlatformStatic || (PlatformStatic = {}));
class ErrorWrapper {
    constructor(err) {
        this.err = err;
        if (err instanceof ReasonableError) {
            this.err_type = 'reasonable';
            this.err_data = err.toJson();
        }
        else if (err instanceof Error) {
            this.err_type = 'crash';
            this.err_data = { msg: err.message + '\n' + err.stack };
        }
        else if (err instanceof String) {
            this.err_type = 'crash';
            this.err_data = { msg: err.toString() };
        }
        else if (typeof err === 'string') {
            this.err_type = 'crash';
            this.err_data = { msg: err };
        }
        else {
            this.err_type = 'crash';
            this.err_data = err;
        }
    }
}

exports.ApiParams = ApiParams;
exports.Auth = Auth;
exports.Authenticator = Authenticator;
exports.CacheProxy = CacheProxy;
exports.CacheWith = CacheWith;
exports.ClassProvider = ClassProvider;
exports.Component = Component;
exports.Delete = Delete;
exports.Disabled = Disabled;
exports.FactoryProvider = FactoryProvider;
exports.Get = Get;
exports.Inject = Inject;
exports.Injector = Injector;
exports.Judgement = Judgement;
exports.LifeCycle = LifeCycle;
exports.Meta = Meta;
exports.NoWrap = NoWrap;
exports.NullInjector = NullInjector;
exports.PURE_PARAMS = PURE_PARAMS;
exports.Platform = Platform;
exports.Post = Post;
exports.Put = Put;
exports.ResultWrapper = ResultWrapper;
exports.Router = Router;
exports.SessionContext = SessionContext;
exports.SessionData = SessionData;
exports.ToraModule = ToraModule;
exports.ToraServer = ToraServer;
exports.ValueProvider = ValueProvider;
exports.crash = crash;
exports.reasonable = reasonable;
exports.response = response;
exports.throw_reasonable = throw_reasonable;
