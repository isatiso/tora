/**
 * @abstract TaskLifeCycle
 */
export abstract class TaskLifeCycle {

    abstract on_init(): Promise<void>

    abstract on_finish<T>(res: T): Promise<void>

    abstract on_error(err: any): Promise<void>

}
