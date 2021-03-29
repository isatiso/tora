import { ClassType, ProviderDef, Type } from './types'

export enum DI_TOKEN {
    component = 'lazor:component',
    cls_type = 'lazor:class-type',

    custom_data = 'lazor:custom-data',

    instance = 'lazor:instance',
    module_provider_collector = 'lazor:module-provider-collector',
    module_routers = 'lazor:module-routers',
    param_injection = 'lazor:param-injection',
    request_handler = 'lazor:request-handler',
    router_handler_collector = 'lazor:router-handler-collector',
    router_imports = 'lazor:router-imports',
    router_providers = 'lazor:router-providers',
    router_handlers = 'lazor:router-handlers',
    router_absolute_path = 'lazor:router-absolute-path',
    router_method_path = 'lazor:router-method-path',
    router_options = 'lazor:router-options',
    router_meta = 'lazor:router-meta',
}

export enum CLS_TYPE {
    tora_module = 'tora-module',
    tora_router = 'tora-router',
}

export namespace TokenUtils {

    export function setClassType(target: any, type: ClassType) {
        if (Reflect.getMetadata(DI_TOKEN.cls_type, target)) {
            throw new Error()
        }
        Reflect.defineMetadata(DI_TOKEN.cls_type, type2token(type), target)
    }

    export function getClassType(target: any) {
        return Reflect.getMetadata(DI_TOKEN.cls_type, target)
    }

    export function ensureClassType(target: any, type: ClassType) {
        if (Reflect.getMetadata(DI_TOKEN.cls_type, target) !== type2token(type)) {
            throw new Error(`${target.name} is not a ToraModule.`)
        }
    }

    export function getRouters(target: any): Type<any>[] {
        return Reflect.getMetadata(DI_TOKEN.module_routers, target)
    }

    export function setRouterImports(router: Type<any>, imports?: Array<Type<any>>) {
        Reflect.defineMetadata(DI_TOKEN.router_imports, imports, router)
    }

    export function getRouterImports(router: Type<any>): Array<Type<any>> {
        return Reflect.getMetadata(DI_TOKEN.router_imports, router)
    }

    export function setRouterProviders(router: Type<any>, providers?: (ProviderDef | Type<any>)[]) {
        Reflect.defineMetadata(DI_TOKEN.router_providers, providers, router)
    }

    export function getRouterProviders(router: Type<any>): (ProviderDef | Type<any>)[] {
        return Reflect.getMetadata(DI_TOKEN.router_providers, router)
    }

    function type2token(type: ClassType) {
        if (type === 'tora_router') {
            return CLS_TYPE.tora_router
        } else if (type === 'tora_module') {
            return CLS_TYPE.tora_module
        } else {
            throw new Error(`unknown class type ${type}`)
        }
    }
}


