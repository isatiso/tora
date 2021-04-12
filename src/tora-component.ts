import 'reflect-metadata'
import { TokenUtils } from './token'
import { ComponentOptions } from './types'

/**
 * @annotation Component
 *
 * Mark for Reflect to resolve types of this class and constructor parameters.
 *
 * @param options
 */
export function ToraComponent(options?: ComponentOptions) {
    return function(target: any) {
        TokenUtils.setClassTypeNX(target, 'ToraComponent')
        TokenUtils.ToraComponent.set(target, target.name)
    }
}

export const Component = ToraComponent
