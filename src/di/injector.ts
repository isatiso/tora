import { Provider } from '../types'

class _NullInjector {
    get(token: any, info?: string) {
        throw new Error(`Can't find ${token?.name ?? token} in NullInjector [${info}]`)
    }
}

export const NullInjector = new _NullInjector()

export type InjectorType = Injector | _NullInjector

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

export class Injector {

    provider?: InjectorProvider

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
                this.provider = new InjectorProvider('injector', this)
            }
            return this.provider
        }
        return this.providers.get(token) ?? this.parent.get(token, info)
    }
}
