/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteContext } from './types'

/**
 * @category Error
 */
export class ReasonableError extends Error {

    constructor(readonly code: number, readonly msg: string, readonly detail?: any) {
        super(msg)
    }

    toJson() {
        return {
            code: this.code,
            msg: this.msg,
            detail: this.detail
        }
    }
}

/**
 * @category Error
 */
export class InnerFinish<Context extends LiteContext = LiteContext> extends Error {

    constructor(private response_body: any) {
        super('')
    }

    get body() {
        return this.response_body
    }
}

/**
 * @category Error
 */
export class OuterFinish<Context extends LiteContext = LiteContext> extends Error {

    constructor(private _ctx: Context, private response_body: any) {
        super('')
    }

    get body() {
        return this.response_body
    }

    get ctx() {
        return this._ctx
    }
}

/**
 * 返回一个受控异常，包含预先定义的状态码和错误信息。
 * @category Error
 */
export function reasonable(code: number, msg: string, detail?: any) {
    return new ReasonableError(code, msg, detail)
}

/**
 * 直接抛出一个受控异常，跳出执行过程，返回预先定义的状态码和错误信息。
 * @category Error
 */
export function throw_reasonable(code: number, msg: string, detail?: any): never {
    throw new ReasonableError(code, msg, detail)
}

/**
 * 未知异常，直接抛出异常，提供可选的调试信息。
 * @category Error
 */
export function crash(msg: any): never {
    throw new Error(msg)
}

/**
 * 跳出执行过程，直接返回响应结果。
 * @category Error
 *
 * @param koa_context
 * @param data 响应结果。
 */
export function response<C extends LiteContext>(koa_context: C, data: any): never {
    throw new OuterFinish(koa_context, data)
}
