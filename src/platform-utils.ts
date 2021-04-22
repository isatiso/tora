import { Dayjs } from 'dayjs'
import { ApiParams, SessionContext, TaskContext } from './builtin'
import { InnerFinish, OuterFinish, reasonable, ReasonableError } from './error'
import { Injector } from './injector'
import { Authenticator } from './service/authenticator'
import { CacheProxy } from './service/cache-proxy'
import { LifeCycle } from './service/life-cycle'
import { ResultWrapper } from './service/result-wrapper'
import { TaskLifeCycle } from './service/task-life-cycle'
import { TaskLock } from './service/task-lock'
import { HandlerDescriptor, KoaResponseType, LiteContext, Provider, TaskDescriptor } from './types'

/**
 * @category Platform
 */
export const PURE_PARAMS = 'PURE_PARAMS'

export class ToraError<T> {

    public readonly err_data: any
    public readonly err_type: 'reasonable' | 'crash'

    constructor(public readonly err: T) {
        if (err instanceof ReasonableError) {
            this.err_type = 'reasonable'
            this.err_data = err.toJson()
        } else if (err instanceof Error) {
            this.err_type = 'crash'
            this.err_data = { msg: err.message + '\n' + err.stack }
        } else if (err instanceof String) {
            this.err_type = 'crash'
            this.err_data = { msg: err.toString() }
        } else if (typeof err === 'string') {
            this.err_type = 'crash'
            this.err_data = { msg: err }
        } else {
            this.err_type = 'crash'
            this.err_data = err
        }
    }
}

/**
 * @namespace PlatformUtils
 *
 * collection functions
 */
export namespace PlatformUtils {

    export function finish_process(koa_context: LiteContext, response_body: KoaResponseType) {
        koa_context.response.body = response_body
    }

    export async function run_handler(handler_wrapper: () => any) {
        try {
            return await handler_wrapper?.()
        } catch (reason) {
            if (reason instanceof InnerFinish) {
                return await reason.body
            } else if (reason instanceof OuterFinish) {
                return reason
            } else {
                return new ToraError(reason)
            }
        }
    }

    function on_error_or_throw(hooks: TaskLifeCycle | undefined, err: any, context: TaskContext) {
        if (hooks) {
            return hooks.on_error(err, context)
        } else {
            throw err
        }
    }

    export function makeTask(injector: Injector, desc: TaskDescriptor, provider_list: Provider<any>[]) {
        return async function(execution: Dayjs) {
            const hooks: TaskLifeCycle | undefined = injector.get(TaskLifeCycle)?.create()
            const task_lock: TaskLock | undefined = injector.get(TaskLock)?.create()
            if (desc.lock && !task_lock) {
                throw new Error(`Decorator "@Lock" is settled on ${desc.pos}, but there's no "TaskLock" implements found.`)
            }

            const context = new TaskContext({
                execution,
                pos: desc.pos!,
                property_key: desc.property_key!,
                crontab: desc.crontab!,
                lock: desc.lock,
            })

            await hooks?.on_init(context)
            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else {
                    return provider.create()
                }
            })

            if (task_lock && desc.lock) {
                const locked = await task_lock.lock(desc.lock.key ?? desc.pos, context)
                if (locked !== undefined) {
                    return desc.handler(...param_list)
                        .then((res: any) => hooks?.on_finish(res, context))
                        .catch((err: any) => on_error_or_throw(hooks, err, context))
                        .finally(() => task_lock.unlock(desc.lock?.key!, locked, context))
                } else {
                    await task_lock.on_lock_failed(context)
                }
            } else {
                return desc.handler(...param_list)
                    .then((res: any) => hooks?.on_finish(res, context))
                    .catch((err: any) => on_error_or_throw(hooks, err, context))
            }
        }
    }

    export function makeHandler(injector: Injector, desc: HandlerDescriptor, provider_list: Provider<any>[]) {

        return async function(params: any, koa_context: LiteContext) {

            const cache: CacheProxy | undefined = injector.get(CacheProxy)?.create()
            const result_wrapper: ResultWrapper | undefined = injector.get(ResultWrapper)?.create()
            const hooks: LifeCycle | undefined = injector.get(LifeCycle)?.create()
            const authenticator: Authenticator | undefined = injector.get(Authenticator)?.create()

            const auth_info = await authenticator?.auth(koa_context)

            const context = new SessionContext(koa_context, auth_info, cache, desc.cache_prefix, desc.cache_expires)

            await hooks?.on_init(context)

            if (desc.auth) {
                if (!authenticator) {
                    const err = new ToraError(new Error('no provider for <Authenticator>.'))
                    await hooks?.on_error(context, err)
                    const err_result = desc.wrap_result ? result_wrapper?.wrap_error(err, context) ?? { error: err.err_data } : { error: err.err_data }
                    return finish_process(koa_context, err_result)
                }
                if (auth_info === undefined) {
                    const err = new ToraError(reasonable(401, 'Unauthorized.'))
                    await hooks?.on_error(context, err)
                    const err_result = desc.wrap_result ? result_wrapper?.wrap_error(err, context) ?? { error: err.err_data } : { error: err.err_data }
                    return finish_process(koa_context, err_result)
                }
            }

            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === PURE_PARAMS) {
                    return params
                } else if (provider === ApiParams) {
                    return new ApiParams(params)
                } else if (provider === SessionContext) {
                    return context
                } else {
                    return provider.create()
                }
            })

            const handler_result: any = await run_handler(() => desc.handler(...param_list))

            if (handler_result instanceof ToraError) {
                await hooks?.on_error(context, handler_result)
                const err_response = desc.wrap_result ? result_wrapper?.wrap_error(handler_result, context) ?? { error: handler_result.err_data } : { error: handler_result.err_data }
                finish_process(koa_context, err_response)
            } else if (handler_result instanceof OuterFinish) {
                await hooks?.on_finish(context)
                const normal_res = desc.wrap_result ? result_wrapper?.wrap(handler_result.body, context) ?? handler_result.body : handler_result.body
                finish_process(koa_context, normal_res)
            } else {
                await hooks?.on_finish(context)
                const normal_res = desc.wrap_result ? result_wrapper?.wrap(handler_result, context) ?? handler_result : handler_result
                finish_process(koa_context, normal_res)
            }
        }
    }
}
