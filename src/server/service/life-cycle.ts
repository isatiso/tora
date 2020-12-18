import { SessionContext } from '../context'
import { SessionData } from '../session-data'

/**
 * @abstract LifeCycle
 */
export abstract class LifeCycle {

    abstract on_init(cs: SessionContext, data: SessionData): Promise<void>

    abstract on_finish(cs: SessionContext, data: SessionData): Promise<void>

    abstract on_error(cs: SessionContext, data: SessionData, err: any): Promise<void>

}
