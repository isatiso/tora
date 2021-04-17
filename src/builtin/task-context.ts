/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dayjs } from 'dayjs'

/**
 * 任务执行上下文。
 *
 * @category Builtin
 */
export class TaskContext {

    private readonly _lock_key?: string
    private readonly _lock_expires?: number
    private readonly _crontab: string
    private readonly _pos: string
    private readonly _property_key: string
    private readonly _execution: Dayjs

    constructor(
        desc: {
            crontab: string,
            execution: Dayjs,
            pos: string,
            property_key: string,
            lock?: {
                key: string
                expires?: number
            },
        }
    ) {
        this._crontab = desc.crontab
        this._pos = desc.pos
        this._property_key = desc.property_key
        this._execution = desc.execution
        this._lock_key = desc.lock?.key
        this._lock_expires = desc.lock?.expires
    }

    get lock_key(): string | undefined {
        return this._lock_key
    }

    get lock_expires(): number | undefined {
        return this._lock_expires
    }

    get crontab(): string {
        return this._crontab
    }

    get pos(): string {
        return this._pos
    }

    get property_key(): string {
        return this._property_key
    }

    get execution(): Dayjs {
        return this._execution
    }
}
