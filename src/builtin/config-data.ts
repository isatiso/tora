import { KeyOfFilterType } from '../types'

export class ConfigData<T> {

    private _cache: {
        [K in KeyOfFilterType<T, object>]?: ConfigData<T[K]>
    } = {}

    constructor(
        private _data: T
    ) {
    }

    deep<K extends KeyOfFilterType<T, object>>(prop: K): ConfigData<T[K]> {
        if (!this._cache[prop]) {
            this._cache[prop] = new ConfigData(this._data[prop])
        }
        return this._cache[prop]!
    }

    get<K extends keyof T>(prop: K): T[K] {
        return JSON.parse(JSON.stringify(this._data[prop]))
    }

    toJson(): T {
        return JSON.parse(JSON.stringify(this._data))
    }
}
