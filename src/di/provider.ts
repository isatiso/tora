/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../token'
import { ClassProviderDef, FactoryProviderDef, Provider, ProviderDef, Type, ValueProviderDef } from '../types'
import { Injector } from './injector'

/**
 * @private
 *
 * @param defs
 * @param injector
 */
export function def2Provider(defs: (ProviderDef | Type<any>)[], injector: Injector) {
    return defs?.map(def => {
        if ((def as any).useValue) {

            const d = def as ValueProviderDef
            if (injector.local_has(d.provide)) {
                return injector.get(d.provide)
            } else {
                const provider = new ValueProvider('valueProvider', d.useValue)
                injector.set_provider(d.provide, provider)
                return provider
            }

        } else if ((def as any).useFactory) {

            const d = def as FactoryProviderDef
            if (injector.local_has(d.provide)) {
                return injector.get(d.provide)
            } else {
                const provider = new FactoryProvider('FactoryProvider', d.useFactory as any, d.deps)
                injector.set_provider(d.provide, provider)
                return provider
            }

        } else if ((def as any).useClass) {

            const d = def as ClassProviderDef
            const component_name = TokenUtils.ToraComponent.get(d.useClass)
            if (!component_name) {
                throw new Error(`${d.useClass.name} is not Component.`)
            }
            if (injector.local_has(d.provide)) {
                return injector.get(d.provide)
            } else {
                const provider = new ClassProvider<any>(d.useClass, injector, d.multi)
                injector.set_provider(d.provide, provider)
                return provider
            }

        } else {

            const component_name = TokenUtils.ToraComponent.get(def)
            if (!component_name) {
                throw new Error(`${(def as any).name} is not Component.`)
            }
            if (injector.local_has(def)) {
                return injector.get(def)
            } else {
                const provider = new ClassProvider<any>(def as any, injector)
                injector.set_provider(def, provider)
                return provider
            }
        }
    })
}

/**
 * ClassProvider
 *
 * Wrap class, and create instance when needed.
 *
 * @category Provider Subtype
 */
export class ClassProvider<M> implements Provider<M> {

    public resolved?: M
    public name: string
    public used = false

    constructor(
        private cls: Type<M>,
        public injector: Injector,
        private readonly multi?: boolean,
    ) {
        this.name = cls.name
        this.multi = this.multi ?? false
    }

    /**
     * @author plankroot
     * @function create instance of this.cls and of its dependence if needed.
     *
     * @param parents: record calling path.
     *
     * @return Provider.
     */
    create(parents?: any[]): M {
        const exist = parents?.indexOf(this.cls) ?? -1
        if (exist >= 0) {
            const circle_path = parents?.slice(exist) ?? []
            circle_path.push(this.cls)
            throw new Error('circle dependency: ' + circle_path.map(cls => cls.name).join(' => '))
        }
        parents = (parents ?? []).concat(this.cls)
        this.used = true
        if (this.multi) {
            return this.get_param_instance(parents)
        }
        if (!this.resolved) {
            this.resolved = this.get_param_instance(parents)
        }
        return this.resolved
    }

    /**
     * @author plankroot
     * @function mark used of provider recursively
     * @param parents
     */
    set_used(parents?: any[]): void {
        parents = (parents ?? []).concat(this.cls)
        this.used = true
        this.set_param_instance_used(parents)
    }

    private get_param_instance(parents?: any[]) {
        const provider_list = this.extract_param_types(parents)
        const param_list = provider_list?.map((provider: any) => {
            return provider?.create(parents)
        }) ?? []
        return new this.cls(...param_list)
    }

    private set_param_instance_used(parents?: any[]) {
        this.extract_param_types(parents)?.forEach((provider: Provider<any>) => provider?.set_used(parents))
    }

    private extract_param_types(parents?: any[]) {
        const inject_token_map = TokenUtils.ParamInjection.get(this.cls)
        return TokenUtils.getParamTypes(this.cls)
            ?.map((token: any, i: number) => {
                const inject_token = inject_token_map?.[i]
                if (inject_token) {
                    token = inject_token
                }
                if (token === undefined) {
                    throw new Error(`type 'undefined' at ${this.cls?.name}.constructor[${i}], if it's not specified, there maybe a circular import.`)
                }
                const provider = this.injector.get(token, `${parents?.map(p => p.name).join(' -> ')}`)
                if (provider) {
                    return provider
                }
                throw new Error(`Can't find provider of "${token}" in [${this.cls?.name}, constructor, args[${i}]]`)
            })
    }
}

/**
 * ValueProvider
 *
 * Wrap const value, and return it when needed.
 *
 * @category Provider Subtype
 */
export class ValueProvider<M> implements Provider<M> {

    public used = false

    constructor(
        public name: string,
        private readonly value: M
    ) {
    }

    create() {
        this.used = true
        return this.value
    }

    set_used(): void {
        this.used = true
    }
}

/**
 * FactoryProvider
 *
 * Wrap factory function, and execute it when needed.
 *
 * @category Provider Subtype
 */
export class FactoryProvider<M> implements Provider<M> {

    public used = false

    constructor(
        public name: string,
        private factory: (...args: any[]) => M,
        private deps?: any[]
    ) {
    }

    create() {
        this.used = true
        return this.factory(...(this.deps ?? []))
    }

    /**
     * @function mark used of provider.
     */
    set_used(): void {
        this.used = true
    }
}
