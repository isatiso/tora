/**
 * @abstract TaskLock
 */
import { Dayjs } from 'dayjs'

export abstract class TaskLock {

    /**
     * @param key
     * @param execution
     * @param expires
     *
     * @return secret
     */
    abstract lock(key: string, execution: Dayjs, expires?: number): Promise<string | boolean | null | undefined>

    /**
     *
     * @param key
     * @param secret
     */
    abstract unlock(key: string, secret: string | boolean | null | undefined): Promise<void>

}
