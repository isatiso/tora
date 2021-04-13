/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LiteContext } from '../../types'

/**
 * Extend this class to implement Authenticator.
 *
 * @category Abstract Service
 */
export abstract class Authenticator<USER_INFO> {

    abstract load_token(ctx: LiteContext): this

    abstract auth(): Promise<USER_INFO | undefined>

    abstract get_user_info(): USER_INFO | undefined

}
