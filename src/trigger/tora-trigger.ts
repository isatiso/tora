import { LockDescriptor } from '../di/annotation'
import { Schedule, ScheduleOptions } from './schedule'
import { AnnotationTools, ClassProvider, Injector } from '../di'
import { DI_TOKEN, TokenUtils } from '../token'
import { makeProviderCollector } from '../tora-module'
import { ProviderDef, TaskDescriptor, Type } from '../types'

export interface TriggerOptions {
    imports?: Array<Type<any>>
    providers?: (ProviderDef | Type<any>)[]
}

/**
 * @annotation Trigger
 *
 * Collect and load trigger info.
 *
 */
export function Trigger(options?: TriggerOptions) {
    return function(constructor: any) {
        TokenUtils.setClassType(constructor, 'tora_trigger')
        Reflect.defineMetadata(DI_TOKEN.trigger_options, options, constructor)
        Reflect.defineMetadata(DI_TOKEN.trigger_task_collector, makeTaskCollector(constructor, options), constructor)
        Reflect.defineMetadata(DI_TOKEN.module_provider_collector, makeProviderCollector(constructor, options), constructor)
    }
}

export function Task(crontab: string, options: ScheduleOptions) {
    return function(target: any, key: string, desc: PropertyDescriptor) {
        const task: TaskDescriptor = AnnotationTools.get_set_meta_data(DI_TOKEN.task_handler, target, key, {})
        task.crontab = Schedule.parse(crontab, options)
        task.property_key = key
        if (!task.handler) {
            task.handler = desc.value
        }
        if (!task.param_types) {
            const inject_token_map = Reflect.getMetadata(DI_TOKEN.param_injection, target, key)
            task.param_types = Reflect.getMetadata('design:paramtypes', target, key)
                ?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
        }
        const tasks: Array<any> = AnnotationTools.get_set_meta_data(DI_TOKEN.trigger_tasks, target, undefined, [])
        if (!tasks.includes(task)) {
            tasks.push(task)
        }
    }
}

function makeTaskCollector(target: any, options?: TriggerOptions) {
    return function(injector: Injector) {
        const instance = new ClassProvider(target, injector).create()
        Reflect.defineMetadata(DI_TOKEN.instance, instance, target)
        const tasks: TaskDescriptor[] = AnnotationTools.get_set_meta_data(DI_TOKEN.trigger_tasks, target.prototype, undefined, [])
        tasks?.forEach((t: any) => {
            const disabled = Reflect.getMetadata(DI_TOKEN.disabled, target.prototype, t.property_key)
            const lock: LockDescriptor = Reflect.getMetadata(DI_TOKEN.lock, target.prototype, t.property_key)
            Object.assign(t, {
                disabled, lock,
                pos: `${target.name}.${t.property_key}`,
                handler: t.handler.bind(instance)
            })
        })
        return tasks
    }
}


