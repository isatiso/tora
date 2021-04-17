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
 * @category Error
 */
export function reasonable(code: number, msg: string, detail?: any) {
    return new ReasonableError(code, msg, detail)
}

/**
 * @category Error
 */
export function throw_reasonable(code: number, msg: string, detail?: any): never {
    throw new ReasonableError(code, msg, detail)
}

/**
 * @category Error
 */
export function crash(msg: any): never {
    throw new Error(msg)
}

/**
 * @category Error
 */
export function response<C extends LiteContext>(ctx: C, data: any): never {
    throw new OuterFinish(ctx, data)
}
