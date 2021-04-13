/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Class to save and pass data in a single session.
 *
 * @category API Injectable
 */
export class SessionData<T extends object = any> {

    private _custom_data: Partial<T> = {}

    set<M extends keyof T>(key: M, value: T[M]) {
        this._custom_data[key] = value
    }

    get<M extends keyof T>(key: M): T[M] | undefined {
        return this._custom_data[key]
    }
}
