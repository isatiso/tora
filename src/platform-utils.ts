import { Dayjs } from 'dayjs'
import { ApiParams, SessionContext, TaskContext } from './builtin'
import { InnerFinish, OuterFinish, ReasonableError } from './error'
import { Injector } from './injector'
import { PURE_PARAMS } from './platform'
import { Authenticator } from './service/authenticator'
import { CacheProxy } from './service/cache-proxy'
import { LifeCycle } from './service/life-cycle'
import { ResultWrapper } from './service/result-wrapper'
import { TaskLifeCycle } from './service/task-life-cycle'
import { TaskLock } from './service/task-lock'
import { HandlerDescriptor, KoaResponseType, LiteContext, Provider, TaskDescriptor } from './types'

class ErrorWrapper<T> {

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

export type ToraError<T> = ErrorWrapper<T>

/**
 * @namespace PlatformUtils
 *
 * collection functions
 */
export namespace PlatformUtils {

    export function finish_process(ctx: LiteContext, r: KoaResponseType) {
        ctx.response.body = r
    }

    export async function run_handler(cs: LiteContext, handler_wrapper: () => any) {
        try {
            return await handler_wrapper?.()
        } catch (reason) {
            if (reason instanceof InnerFinish) {
                return await reason.body
            } else if (reason instanceof OuterFinish) {
                return reason
            } else {
                return new ErrorWrapper(reason)
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

        return async function(params: any, cs: LiteContext) {

            const cache: CacheProxy | undefined = injector.get(CacheProxy)?.create()
            const result_wrapper: ResultWrapper | undefined = injector.get(ResultWrapper)?.create()
            const hooks: LifeCycle | undefined = injector.get(LifeCycle)?.create()
            const authenticator: Authenticator<any> | undefined = injector.get(Authenticator)?.create()

            const auth_info = await authenticator?.auth(cs)

            const context = new SessionContext(cs, auth_info, cache, desc.cache_prefix, desc.cache_expires)

            await hooks?.on_init(context)

            if (desc.auth) {
                if (!authenticator) {
                    throw new Error(`no provider for <Authenticator>.`)
                }
                if (auth_info === undefined) {
                    return finish_process(cs, { error: { code: 401, msg: 'Unauthorized.' } })
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

            const res = await run_handler(cs, () => desc.handler(...param_list))

            if (res instanceof ErrorWrapper) {
                await hooks?.on_error(context, res)
                finish_process(cs, { error: res.err_data })
            } else if (res instanceof OuterFinish) {
                await hooks?.on_finish(context)
                finish_process(cs, res.body)
            } else {
                await hooks?.on_finish(context)
                const real_result = desc.wrap_result ? result_wrapper?.wrap(res, context) ?? res : res
                finish_process(cs, real_result)
            }
        }
    }
}
