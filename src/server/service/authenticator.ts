import { LiteContext } from '../../types'

/**
 * @abstract Authenticator
 */
export abstract class Authenticator<USER_INFO> {

    abstract load_token(ctx: LiteContext): this

    abstract auth(): Promise<USER_INFO | undefined>

    abstract get_user_info(): USER_INFO | undefined

}
