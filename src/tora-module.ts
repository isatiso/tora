import 'reflect-metadata'
import { ClassProvider, FactoryProvider, Injector, ValueProvider } from './di'
import { DI_TOKEN, TokenUtils } from './token'
import { ClassProviderDef, FactoryProviderDef, Provider, ProviderDef, Type, ValueProviderDef } from './type'

export interface ToraModuleDef {
    imports?: Array<Type<any>>
    providers?: (ProviderDef | Type<any>)[]
    router_gate?: Type<any>
}

export interface ProviderTreeNode {
    name: string
    providers: any[]
    children: ProviderTreeNode[]
}

export function ToraModule(options?: ToraModuleDef) {
    return function(target: any) {
        TokenUtils.setClassType(target, 'tora_module')
        Reflect.defineMetadata(DI_TOKEN.module_provider_collector, makeProviderCollector(target, options), target)
        if (options?.router_gate) {
            Reflect.defineMetadata(DI_TOKEN.module_router_gate, options.router_gate, target)
        }
    }
}

export function find_usage(tree: ProviderTreeNode, indent: number = 0): boolean {
    return tree?.providers?.find(p => p.used)
        || tree?.children?.find(t => find_usage(t, indent + 1))
}

function makeProviderCollector(target: any, options?: ToraModuleDef) {
    return function(injector: Injector) {
        const children = options?.imports?.map(md => Reflect.getMetadata(DI_TOKEN.module_provider_collector, md)?.(injector))
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

function def2Provider(defs: (ProviderDef | Type<any>)[], injector: Injector) {
    return defs?.map(def => {
        if ((def as any).useValue) {

            const d = def as ValueProviderDef
            return [d.provide, new ValueProvider('valueProvider', d.useValue)]

        } else if ((def as any).useFactory) {

            const d = def as FactoryProviderDef
            return [d.provide, new FactoryProvider('FactoryProvider', d.useFactory as any, d.deps),]

        } else if ((def as any).useClass) {

            const d = def as ClassProviderDef
            const isComponent = Reflect.getMetadata(DI_TOKEN.component, d.useClass)
            if (!isComponent) {
                throw new Error(`${d.useClass.name} is not Component.`)
            }
            return [d.provide, new ClassProvider<any>(d.useClass, injector, d.multi)]

        } else {

            const isComponent = Reflect.getMetadata(DI_TOKEN.component, def as any)
            if (!isComponent) {
                throw new Error(`${(def as any).name} is not Component.`)
            }
            return [def, new ClassProvider<any>(def as any, injector)]
        }
    })
}

