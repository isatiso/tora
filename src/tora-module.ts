import 'reflect-metadata'
import { Injector } from './di'
import { def2Provider } from './di/provider'
import { TokenUtils } from './token'
import { ImportsAndProviders, ModuleOptions, Provider, ProviderDef, ProviderTreeNode, Type } from './types'

/**
 * @annotation ToraModule
 *
 * Dependency injector core. Collect and assemble provider in this annotation.
 *
 * @param options(ToraModuleDef)
 */
export function ToraModule(options?: ModuleOptions) {
    return function(target: any) {
        TokenUtils.setClassTypeNX(target, 'ToraModule')
        TokenUtils.ToraModuleProviderCollector.set(target, makeProviderCollector(target, options))
        TokenUtils.ToraModuleRouters.set(target, options?.routers)
        TokenUtils.ToraModuleTasks.set(target, options?.tasks)
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

export function makeProviderCollector(target: any, options?: ImportsAndProviders) {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => TokenUtils.ToraModuleProviderCollector.get(md)?.(injector)) ?? []

        const providers: Provider<any>[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef | Type<any>)[], injector) ?? []
        ]

        return { name: target.name, providers, children }
    }
}

