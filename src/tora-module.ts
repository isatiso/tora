import 'reflect-metadata'
import { ClassProvider, FactoryProvider, Injector, ValueProvider } from './di'
import { def2Provider } from './di/provider'
import { DI_TOKEN, TokenUtils } from './token'
import { ClassProviderDef, FactoryProviderDef, Provider, ProviderDef, Type, ValueProviderDef } from './types'

/**
 * @interface ToraModuleDef
 */
export interface ToraModuleDef {
    imports?: Array<Type<any>>
    providers?: (ProviderDef | Type<any>)[]
    routers?: Type<any>[]
    tasks?: Type<any>[]
}

/**
 * @interface ProviderTreeNode
 */
export interface ProviderTreeNode {
    name: string
    providers: any[]
    children: ProviderTreeNode[]
}

/**
 * @annotation ToraModule
 *
 * Dependency injector core. Collect and assemble provider in this annotation.
 *
 * @param options(ToraModuleDef)
 */
export function ToraModule(options?: ToraModuleDef) {
    return function(target: any) {
        TokenUtils.setClassType(target, 'tora_module')
        Reflect.defineMetadata(DI_TOKEN.module_provider_collector, makeProviderCollector(target, options), target)
        if (options?.routers?.length) {
            Reflect.defineMetadata(DI_TOKEN.module_routers, options.routers, target)
        }
        if (options?.tasks?.length) {
            Reflect.defineMetadata(DI_TOKEN.module_tasks, options.tasks, target)
        }
    }
}

/**
 * @function
 *
 * Walk through the provider tree, and find class which has no usage.
 *
 * @param tree_node(ProviderTreeNode)
 * @param indent
 */
export function find_usage(tree_node: ProviderTreeNode, indent: number = 0): boolean {
    return tree_node?.providers?.find(p => p.used)
        || tree_node?.children?.find(t => find_usage(t, indent + 1))
}

export function makeProviderCollector(target: any, options?: ToraModuleDef) {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => Reflect.getMetadata(DI_TOKEN.module_provider_collector, md)?.(injector)) ?? []

        const providers: Provider<any>[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef | Type<any>)[], injector) ?? []
        ]

        return { name: target.name, providers, children }
    }
}

