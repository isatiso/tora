import { Provider, ValueProvider } from './provider'

class _NullInjector {
    get(token: any, info?: string) {
        throw new Error(`Can't find ${token?.name ?? token} in NullInjector [${info}]`)
    }
}

export const NullInjector = new _NullInjector()

export type InjectorType = Injector | _NullInjector

export class Injector {

    provider?: ValueProvider<Injector>

    constructor(
        private parent: InjectorType,
        public providers: Map<any, any> = new Map()
    ) {
    }

    static create(parent?: InjectorType | null, providers?: Map<any, any>): Injector {
        providers = providers || new Map()
        return new Injector(parent ?? NullInjector, providers)
    }

    set_provider(token: any, provider: Provider<any>) {
        this.providers.set(token, provider)
    }

    get(token: any, info?: string): Provider<any> {
        if (token === Injector) {
            if (!this.provider) {
                this.provider = new ValueProvider('injector', this)
            }
            return this.provider
        }
        return this.providers.get(token) ?? this.parent.get(token, info)
    }
}
