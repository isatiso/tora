import { ExtendableContext } from 'koa'
import { Stream } from 'stream'

export type LiteContext = ExtendableContext & {
    process_start?: number
}

export type ApiReturnDataType =
    null
    | undefined
    | boolean
    | number
    | string
    | ApiReturnDataType[]
    | object
    | Stream
    | Buffer

export type HandlerReturnType<R extends ApiReturnDataType> = R | Promise<R>
export type HttpHandler = (params: any, ctx: LiteContext) => HandlerReturnType<any>

export type ApiPath = string | string[]
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
