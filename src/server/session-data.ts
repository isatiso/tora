export class SessionData<T extends object = any> {

    private _custom_data: Partial<T> = {}

    set(key: keyof T, value: T[typeof key]) {
        this._custom_data[key] = value
    }

    get(key: keyof T): T[typeof key] | undefined {
        return this._custom_data[key]
    }
}
