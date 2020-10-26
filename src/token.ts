import { ClassType } from './types'

export enum DI_TOKEN {
    component = 'lazor:component',
    cls_type = 'lazor:class-type',

    custom_data = 'lazor:custom-data',

    instance = 'lazor:instance',
    module_provider_collector = 'lazor:module-provider-collector',
    module_router_gate = 'lazor:module-router-gate',
    param_injection = 'lazor:param-injection',
    request_handler = 'lazor:request-handler',
    router_handler_collector = 'lazor:router-handler-collector',
    router_handlers = 'lazor:router-handlers',
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

    export function getRouterGate(target: any) {
        return Reflect.getMetadata(DI_TOKEN.module_router_gate, target)
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


