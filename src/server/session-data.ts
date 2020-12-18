/**
 * Class to save and pass data in a single session.
 */
export class SessionData<T extends object = any> {

    private _custom_data: Partial<T> = {}

    set<M extends keyof T>(key: M, value: T[M]) {
        this._custom_data[key] = value
    }

    get<M extends keyof T>(key: M): T[M] | undefined {
        return this._custom_data[key]
    }
}
