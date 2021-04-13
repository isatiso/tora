/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Provider } from '../types'

/**
 * @private
 */
class _NullInjector {

    has(token: any) {
        return false
    }

    get(token: any, info?: string) {
        throw new Error(`Can't find ${token?.name ?? token} in NullInjector [${info}]`)
    }

    readonly children: InjectorType[] = []
}

/**
 * NullInjector, has no provider, usually treat as root of Injector tree.
 *
 * If you searching a provider until here, you will got NullInjectorError.
 */
export const NullInjector = new _NullInjector()

export type InjectorType = Injector | _NullInjector

/**
 * @private
 */
class InjectorProvider implements Provider<Injector> {

    public used = false

    constructor(
        public name: string,
        private readonly value: Injector
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
 * Injector.
 *
 * @category Injector
 */
export class Injector {

    provider?: InjectorProvider
    readonly children: InjectorType[] = []

    constructor(
        private parent: InjectorType,
        public providers: Map<any, any> = new Map()
    ) {
    }

    /**
     * Create Injector.
     *
     * @param parent(InjectorType) - Injector or NullInjector
     * @param providers(Map) - Providers
     */
    static create(parent?: InjectorType | null, providers?: Map<any, any>): Injector {
        providers = providers || new Map()
        parent = parent ?? NullInjector
        const new_instance = new Injector(parent, providers)
        parent.children.push(new_instance)
        return new_instance
    }

    /**
     * Register mapping relation from token to provider.
     *
     * @param token
     * @param provider
     */
    set_provider(token: any, provider: Provider<any>) {
        this.providers.set(token, provider)
    }

    /**
     * @function Injector.get: get a provider from injector.
     * @param token: value to index provider.
     * @param info: debug info, usually is a string to show who or where call this method.
     */
    get(token: any, info?: string): Provider<any> {
        if (token === Injector) {
            if (!this.provider) {
                this.provider = new InjectorProvider('injector', this)
            }
            return this.provider
        }
        return this.providers.get(token) ?? this.parent.get(token, info)
    }

    local_has(token: any): boolean {
        if (token === Injector) {
            return true
        }
        return this.providers.has(token)
    }

    has(token: any): boolean {
        if (token === Injector) {
            return true
        }
        return this.providers.has(token) || this.parent.has(token)
    }
}
