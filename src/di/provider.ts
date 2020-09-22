import { DI_TOKEN } from '../token'
import { Provider, Type } from '../type'
import { Injector } from './injector'

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

    create(parents?: any[]) {
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
        const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, this.cls)
        return Reflect.getMetadata('design:paramtypes', this.cls)?.map((token: any, i: number) => {
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

    set_used(): void {
        this.used = true
    }
}
