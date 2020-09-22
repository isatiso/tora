import { ClassType } from './type'

export enum FM_DI_TOKEN {
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

export enum FM_CLS_TYPE {
    fm_module = 'module',
    fm_router = 'fm-router',
}

export namespace TokenUtils {

    export function setClassType(target: any, type: ClassType) {
        if (Reflect.getMetadata(FM_DI_TOKEN.cls_type, target)) {
            throw new Error()
        }
        Reflect.defineMetadata(FM_DI_TOKEN.cls_type, type2token(type), target)
    }

    export function ensureClassType(target: any, type: ClassType) {
        if (Reflect.getMetadata(FM_DI_TOKEN.cls_type, target) !== type2token(type)) {
            throw new Error(`${target.name} is not FmModule.`)
        }
    }

    function type2token(type: ClassType) {
        if (type === 'fm_router') {
            return FM_CLS_TYPE.fm_router
        } else if (type === 'fm_module') {
            return FM_CLS_TYPE.fm_module
        } else {
            throw new Error(`unknown class type ${type}`)
        }
    }
}


