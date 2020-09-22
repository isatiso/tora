import 'reflect-metadata'
import { DI_TOKEN } from './token'

export function Component(echo_dependencies?: boolean) {
    return function(target: any) {
        if (echo_dependencies) {
            console.log('dependencies', Reflect.getMetadata('design:paramtypes', target))
        }
        Reflect.defineMetadata(DI_TOKEN.component, target.name, target)
    }
}