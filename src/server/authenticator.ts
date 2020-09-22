import { LiteContext } from './types'

export abstract class Authenticator<USER> {

    abstract load_token(ctx: LiteContext): this

    abstract async auth(): Promise<USER | undefined>

    abstract get_user_info(): USER | undefined

}
