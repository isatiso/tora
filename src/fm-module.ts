import 'reflect-metadata'
import { def2Provider, Injector, Provider } from './di'
import { FM_DI_TOKEN, TokenUtils } from './token'
import { ProviderDef, Type } from './type'

export interface FmModuleDef {
    imports?: Array<Type<any>>
    providers?: (ProviderDef | Type<any>)[]
    router_gate?: Type<any>
}

export interface ProviderTreeNode {
    name: string
    providers: any[]
    children: ProviderTreeNode[]
}

export function FmModule(options?: FmModuleDef) {
    return function(target: any) {
        TokenUtils.setClassType(target, 'fm_module')
        Reflect.defineMetadata(FM_DI_TOKEN.module_provider_collector, makeProviderCollector(target, options), target)
        if (options?.router_gate) {
            Reflect.defineMetadata(FM_DI_TOKEN.module_router_gate, options.router_gate, target)
        }
    }
}

export function find_usage(tree: ProviderTreeNode, indent: number = 0): boolean {
    return tree?.providers?.find(p => p.used)
        || tree?.children?.find(t => find_usage(t, indent + 1))
}

function makeProviderCollector(target: any, options?: FmModuleDef) {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => Reflect.getMetadata(FM_DI_TOKEN.module_provider_collector, md)?.(injector))
        const providers: Provider<any>[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef | Type<any>)[], injector)
                ?.map(item => {
                    injector.set_provider(item[0], item[1])
                    return item[1]
                })
            ?? []]

        return { name: target.name, providers, children }
    }
}
