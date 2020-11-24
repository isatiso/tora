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

    /**
     * @function
     * Return specified <prop> of config object.
     *
     * @param prop(string): name of property
     */
    get<K extends keyof T>(prop: K): Readonly<T[K]> {
        return this._data[prop]
    }

    /**
     * @function
     * Return copy of config property object. If no <prop> specified, return config object self.
     *
     * @param prop(string) - name of property.
     */
    copy(): T
    copy<K extends keyof T>(prop: K): T[K]
    copy<K extends keyof T>(prop?: K): K extends undefined ? T : T[K] {
        if (prop === undefined) {
            return JSON.parse(JSON.stringify(this._data))
        } else {
            return JSON.parse(JSON.stringify(this._data[prop]))
        }
    }
}
