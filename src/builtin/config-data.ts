import { KeyOfFilterType } from '../types'

export interface ToraConfig {
    tora?: {
        port?: number
    }
}

export class ConfigData<T extends ToraConfig> {

    _cache: {
        [K in KeyOfFilterType<T, object>]?: ConfigData<T[K]> | null
    } = {}

    constructor(
        private _data: T
    ) {
    }

    deep<K extends KeyOfFilterType<T, object>, U = T[K]>(prop: K): ConfigData<Exclude<U, undefined>> | (U extends undefined ? undefined : never) {
        if (this._cache[prop] === undefined) {
            if (this._data[prop]) {
                this._cache[prop] = new ConfigData(this._data[prop])
            } else {
                this._cache[prop] = null
            }
        }
        return this._cache[prop] ?? undefined as any
    }

    /**
     * @function
     * Return specified <prop> of config object.
     *
     * @param prop(string): name of property
     */
    get<K extends keyof Omit<T, KeyOfFilterType<T, object>>>(prop: K): T[K] {
        return this._data[prop]
    }

    /**
     * @function
     * Return copy of config object.
     */
    copy(): T {
        return JSON.parse(JSON.stringify(this._data))
    }
}
