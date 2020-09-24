import { SessionContext } from '../context'
import { SessionData } from '../session-data'

export abstract class LifeCycle {

    abstract async on_init(cs: SessionContext, data: SessionData): Promise<void>

    abstract async on_finish(cs: SessionContext, data: SessionData): Promise<void>

    abstract async on_error(cs: SessionContext, data: SessionData, err: any): Promise<void>

}
