import { LiteContext } from '../../types'

/**
 * @abstract Authenticator
 */
export abstract class Authenticator<USER> {

    abstract load_token(ctx: LiteContext): this

    abstract auth(): Promise<USER | undefined>

    abstract get_user_info(): USER | undefined

}
