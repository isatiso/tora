/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @module ToraModule
 *
 * ToraModule
 */
import 'reflect-metadata'
import { Injector } from './di'
import { def2Provider } from './di/provider'
import { TokenUtils } from './token'
import { ImportsAndProviders, ModuleOptions, Provider, ProviderDef, ProviderTreeNode, Type } from './types'

/**
 * @category Annotation
 * @annotation
 *
 * Dependency injector core. Collect and assemble provider in this annotation.
 *
 * e.g.
 * ```typescript
 * @ToraModule({
 *     imports: [
 *         SampleDependency1,
 *         SampleDependency2,
 *     ],
 *     providers: [
 *         SampleComponent1,
 *         SampleComponent2,
 *     ],
 *     routers: [
 *         SampleToraRouter1,
 *         SampleToraRouter2,
 *     ],
 *     tasks: [
 *         SampleToraTrigger1,
 *         SampleToraTrigger2,
 *     ]
 * })
 * class SampleModule {
 *
 * }
 * ```
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
 * @private
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

/**
 * @private
 *
 * @param target
 * @param options
 */
export function makeProviderCollector(target: any, options?: ImportsAndProviders) {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => TokenUtils.ToraModuleProviderCollector.get(md)?.(injector)) ?? []

        const providers: Provider<any>[] = [
            ...def2Provider([...options?.providers ?? []] as (ProviderDef | Type<any>)[], injector) ?? []
        ]

        return { name: target.name, providers, children }
    }
}

