import { Provider } from '../types'

class _NullInjector {
    get(token: any, info?: string) {
        throw new Error(`Can't find ${token?.name ?? token} in NullInjector [${info}]`)
    }
}

export const NullInjector = new _NullInjector()

export type InjectorType = Injector | _NullInjector

/**
 * @author plankroot
 * @class A special provider for injector.
 */
export class InjectorProvider implements Provider<Injector> {

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
 * @author plankroot
 * Injector
 */
export class Injector {

    provider?: InjectorProvider

    constructor(
        private parent: InjectorType,
        public providers: Map<any, any> = new Map()
    ) {
    }

    /**
     * @author plankroot
     * @function Injector#create - create a injector.
     *
     * @param parent(InjectorType) - Injector or NullInjector
     * @param providers(Map) - Providers
     */
    static create(parent?: InjectorType | null, providers?: Map<any, any>): Injector {
        providers = providers || new Map()
        return new Injector(parent ?? NullInjector, providers)
    }

    /**
     * @author plankroot
     * @function Injector.set_provider: record a token - provider mapping relation.
     *
     * @param token(any): value to index provider.
     * @param provider(any): provider for a token.
     */
    set_provider(token: any, provider: Provider<any>) {
        this.providers.set(token, provider)
    }

    /**
     * @author plankroot
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
}
