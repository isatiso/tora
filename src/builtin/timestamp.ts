/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ToraComponent } from '../core'

/**
 * 内置的时间戳服务。
 *
 * [[include:builtin/timestamp.md]]
 *
 * @category Builtin
 */

@ToraComponent()
export class Timestamp extends Number {

    private _timestamp = new Date().getTime()

    valueOf() {
        return this._timestamp
    }
}
