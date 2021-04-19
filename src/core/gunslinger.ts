/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Type } from '../types'

/**
 * @private
 *
 * GunsLinger Type, see {@link Gunslinger}.
 *
 * @category Router Extend
 */
export interface IGunslinger<T> {

    new(): Type<T>

    mount(path: `/${string}`): Type<T> & IGunslinger<T>

    replace<M extends keyof T>(method: M, new_path: string): Type<Omit<T, M>> & IGunslinger<Omit<T, M>>
}

/**
 * Tora.ToraRouter 的扩展函数。
 *
 * @category Router Extend
 */
export function Gunslinger<T>(): IGunslinger<T> {
    return class {
    } as any
}
