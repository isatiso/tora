import { LiteContext } from './server'

export class ToraError extends Error {

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

export class LocalFinishProcess<Context extends LiteContext = LiteContext> extends Error {

    constructor(private response_body: any) {
        super('')
    }

    get body() {
        return this.response_body
    }
}

export class FinishProcess<Context extends LiteContext = LiteContext> extends Error {

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

export function tora_panic(code: number, msg: string, detail?: any) {
    return new ToraError(code, msg, detail)
}

export function throw_tora_panic(code: number, msg: string, detail?: any): never {
    throw new ToraError(code, msg, detail)
}

export function throw_panic(msg: any): never {
    throw new Error(msg)
}

export function finish<C extends LiteContext>(ctx: C, data: any): never {
    throw new FinishProcess(ctx, data)
}
