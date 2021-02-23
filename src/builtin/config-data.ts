export interface ToraConfig {
    tora?: {
        port?: number
    }
}

type Path<T extends Object, Key extends keyof T = keyof T, Value = Exclude<T[Key], undefined>> =
    Key extends string
        ? Value extends Record<string, any>
        ? `${Key}.${Path<Value>}` | Key
        : (Value extends number | string | boolean | null ? Key : never)
        : never;

type PathValue<T extends Object, P extends Path<T>> =
    P extends `${infer Key}.${infer Rest}`
        ? Key extends keyof T
        ? Rest extends Path<Exclude<T[Key], undefined>>
            ? PathValue<Exclude<T[Key], undefined>, Rest>
            : never
        : never
        : P extends keyof T
        ? T[P]
        : never;

export class ConfigData<T extends ToraConfig> {

    _cache: {
        [path: string]: any
    } = {}

    constructor(
        private _data: T
    ) {
        this._cache[''] = JSON.parse(JSON.stringify(this._data))
    }

    /**
     * Return specified <prop> of config object.
     */
    get<K extends Path<T>>(): T
    /**
     * Return specified <prop> of config object.
     *
     * @param path(string): name of property
     */
    get<K extends Path<T>>(path: K): PathValue<T, K>
    get<K extends Path<T>>(path?: K): PathValue<T, K> | T {
        if (!path) {
            return this._cache['']
        }
        if (this._cache[path] === undefined) {
            const paths = path.split('.')
            let data: any = this._data
            for (const p of paths) {
                data = data?.[p]
                if (data === undefined) {
                    data = null
                    break
                }
            }
            this._cache[path] = JSON.parse(JSON.stringify(data))
        }
        return this._cache[path] as any
    }
}
