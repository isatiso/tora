/**
 * @abstract TaskLock
 */
import { Dayjs } from 'dayjs'

export abstract class TaskLock {

    /**
     * @param key Unique identifier for a Task.
     * @param execution The moment of this execution, used to prevent repeated execution, e.g. generate time string.
     * @param expires Specify how many seconds later to unlock automatically.
     *
     * @return secret Depends on implements of lock, tora accept any value except undefined to represent lock successfully.
     */
    abstract lock(key: string, execution: Dayjs, expires?: number): Promise<string | boolean | null | undefined>

    /**
     * @param key Key used by <TaskLock.lock> method.
     * @param secret Returned value from <TaskLock.lock> method.
     */
    abstract unlock(key: string, secret: string | boolean | null | undefined): Promise<void>

}
