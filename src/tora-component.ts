import 'reflect-metadata'
import { DI_TOKEN } from './token'

/**
 * @annotation Component
 *
 * Mark for Reflect to resolve types of this class and constructor parameters.
 *
 * @param echo_dependencies: debug option, show dependencies of this class.
 */
export function Component(echo_dependencies?: boolean) {
    return function(target: any) {
        if (echo_dependencies) {
            console.log('dependencies', Reflect.getMetadata('design:paramtypes', target))
        }
        Reflect.defineMetadata(DI_TOKEN.component, target.name, target)
    }
}
