/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'reflect-metadata'
import { TokenUtils } from './token'
import { ComponentOptions } from './types'

/**
 * @annotation
 *
 * Mark class as Tora normal component, which can be inject to other Tora component.
 *
 * e.g.
 * ```typescript
 * @Component()
 * export class SampleComponent {
 *
 *     constructor(
 *         public sc1: SampleComponent1,
 *         private sc2: SampleComponent2,
 *     ) {
 *     }
 * }
 * ```
 *
 * @public
 * @category Annotation
 *
 * @param options
 */
export function ToraComponent(options?: ComponentOptions) {
    return function(target: any) {
        TokenUtils.setClassTypeNX(target, 'ToraComponent')
        TokenUtils.ToraComponent.set(target, target.name)
    }
}

/**
 * Alias for {@link ToraComponent}
 *
 * @public
 * @category Annotation Alias
 */
export const Component = ToraComponent
