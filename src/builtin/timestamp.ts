/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraService } from '../core'

/**
 * 内置的时间戳服务。
 *
 * [[include:builtin/timestamp.md]]
 *
 * @category Builtin
 */

@ToraService()
export class Timestamp extends Number {

    private _timestamp = new Date().getTime()

    valueOf() {
        return this._timestamp
    }
}
