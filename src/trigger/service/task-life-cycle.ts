/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @abstract TaskLifeCycle
 */
export abstract class TaskLifeCycle {

    abstract on_init(): Promise<void>

    abstract on_finish<T>(res: T): Promise<void>

    abstract on_error(err: any): Promise<void>

}
