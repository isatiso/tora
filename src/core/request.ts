/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../token'
import { ApiMethod, NoTrailingAndLeadingSlash } from '../types'

/**
 * @private
 *
 * @param method
 */
export function createRequestDecorator(method: ApiMethod) {
    return <T extends string>(path_tail?: NoTrailingAndLeadingSlash<T>) => (target: any, key: string, desc: PropertyDescriptor) => {
        const handler = TokenUtils.ToraRouterHandler.getset(target, key, {})

        // Mark handle function.
        if (!handler.property_key) {
            handler.property_key = key
            handler.handler = desc.value
            const inject_token_map = TokenUtils.ParamInjection.get(target, key)
            handler.param_types = TokenUtils.getParamTypes(target, key)?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
            const handlers = TokenUtils.ToraRouterHandlerList.getset(target, [])
            if (!handlers.includes(handler)) {
                handlers.push(handler)
            }
        }

        // Mark handler function if need to wrap result.
        if (handler.wrap_result === undefined) {
            handler.wrap_result = true
        }

        // Mark API tail path with HTTP method.
        if (!handler.method_and_path) {
            handler.method_and_path = {}
        }
        const method_path = path_tail ?? key as string
        handler.method_and_path[`${method}-${method_path}`] = [method, method_path]
    }
}

export const _Get = createRequestDecorator('GET')
export const _Post = createRequestDecorator('POST')
export const _Put = createRequestDecorator('PUT')
export const _Delete = createRequestDecorator('DELETE')
