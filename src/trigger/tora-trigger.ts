/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClassProvider, Injector } from '../di'
import { TokenUtils } from '../token'
import { makeProviderCollector } from '../tora-module'
import { TaskDescriptor, TriggerOptions } from '../types'
import { Schedule, ScheduleOptions } from './cron'

/**
 * Collect and load trigger info.
 *
 * @public
 * @category Annotation
 *
 * @param options
 */
export function ToraTrigger(options?: TriggerOptions) {
    return function(constructor: any) {
        TokenUtils.setClassTypeNX(constructor, 'ToraTrigger')
        TokenUtils.ToraTriggerOptions.set(constructor, options)
        TokenUtils.ToraTriggerTaskCollector.set(constructor, makeTaskCollector(constructor, options))
        TokenUtils.ToraModuleProviderCollector.set(constructor, makeProviderCollector(constructor, options))
    }
}

export function Task(crontab: string, options?: ScheduleOptions) {
    return function(target: any, key: string, desc: PropertyDescriptor) {

        if (TokenUtils.ToraTriggerTask.has(target, key)) {
            throw new Error(`Decorator @Task duplicated on method ${key}.`)
        }

        const task: TaskDescriptor = {}
        task.crontab = Schedule.parse(crontab, options)
        task.property_key = key
        task.handler = desc.value
        const inject_token_map = TokenUtils.ParamInjection.get(target, key)
        task.param_types = TokenUtils.getParamTypes(target, key)
            ?.map((t: any, i: number) => inject_token_map?.[i] ?? t)

        TokenUtils.ToraTriggerTask.set(target, key, task)

        const tasks = TokenUtils.ToraTriggerTaskList.getset(target, [])
        if (!tasks.includes(task)) {
            tasks.push(task)
        }
    }
}

function makeTaskCollector(target: any, options?: TriggerOptions) {
    return function(injector: Injector) {
        const instance = new ClassProvider<typeof target>(target, injector).create()
        TokenUtils.Instance.set(target, instance)
        const tasks = TokenUtils.ToraTriggerTaskList.getset(target, [])
        tasks?.forEach((t: any) => {
            const disabled = TokenUtils.DisabledMeta.get(target.prototype, t.property_key)
            const lock = TokenUtils.LockMeta.get(target.prototype, t.property_key)
            Object.assign(t, {
                disabled,
                lock,
                pos: `${target.name}.${t.property_key}`,
                handler: t.handler.bind(instance)
            })
        })
        return tasks
    }
}


