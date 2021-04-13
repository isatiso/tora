/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '../tora-component'

/**
 * Injectable Timestamp.
 *
 * e.g.
 * ```
 * @Component()
 * class TestRouter {
 *
 *     @Post()
 *     async test(
 *         now: CurrentTimestamp
 *     ) {
 *         return { timestamp: +now }
 *     }
 * }
 * ```
 *
 * @category Builtin Component
 */
@Component()
export class CurrentTimestamp extends Number {

    private _timestamp = new Date().getTime()

    valueOf() {
        return this._timestamp
    }
}
