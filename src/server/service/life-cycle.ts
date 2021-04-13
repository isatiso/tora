/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SessionContext } from '../session-context'
import { SessionData } from '../session-data'

/**
 * Extend this class to implement LifeCycle.
 *
 * @category Abstract Service
 */
export abstract class LifeCycle {

    abstract on_init(cs: SessionContext, data: SessionData): Promise<void>

    abstract on_finish(cs: SessionContext, data: SessionData): Promise<void>

    abstract on_error(cs: SessionContext, data: SessionData, err: any): Promise<void>

}
