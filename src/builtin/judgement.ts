/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type ValueType =
    | 'exist'
    | 'function'
    | 'object'
    | 'array'
    | 'nonEmptyArray'
    | 'null'
    | 'nonNull'
    | 'string'
    | 'nonEmptyString'
    | 'number'
    | 'nonZeroNumber'
    | 'boolean'
    | 'true'
    | 'false'

/**
 * @private
 * 推断配置对象的合法路径。
 */
export type Path<T, Key extends keyof T = keyof T> =
    Key extends string
        ?
        Exclude<T[Key], undefined> extends Array<any>
            ?
            `${Key}.${Path<Exclude<T[Key], undefined>, Exclude<keyof Exclude<T[Key], undefined>, keyof Array<any> & string>>}` | Key
            :
            Exclude<T[Key], undefined> extends Record<string, any>
                ?
                `${Key}.${Path<Exclude<T[Key], undefined>>}` | Key
                :
                Key
        :
        never;

/**
 * @private
 * 根据指定的配置路径推断配置内容。
 */
export type PathValue<T extends Object, P extends Path<T>> =
    P extends `${infer Key}.${infer Rest}`
        ?
        Key extends keyof T
            ?
            Rest extends Path<Exclude<T[Key], undefined>>
                ?
                PathValue<Exclude<T[Key], undefined>, Rest>
                :
                never
            :
            never
        :
        P extends keyof T
            ?
            T[P]
            :
            never;

/**
 * @private
 */
export class Reference<T> {

    private _cache: {
        [path: string]: { value: any }
    } = {}

    constructor(public data: T) {
        this._cache[''] = { value: JSON.parse(JSON.stringify(this.data)) }
    }

    get(): T
    get<P extends Path<T>>(path: P): PathValue<T, P> | undefined;
    get<P extends Path<T>>(path: P, def: PathValue<T, P>): Exclude<PathValue<T, P>, undefined> ;
    get<P extends Path<T>>(path?: P, def?: PathValue<T, P>): T | PathValue<T, P> | undefined {
        if (!path) {
            return this._cache[''].value
        }
        if (this._cache[path] === undefined) {
            const paths = path.split('.')
            let data: any = this.data
            for (const p of paths) {
                data = data?.[p]
                if (data === undefined) {
                    break
                }
            }
            this._cache[path] = { value: JSON.parse(JSON.stringify(data ?? def)) }
        }
        return this._cache[path].value as any
    }
}

/**
 * @private
 */
export class Judgement<T> extends Reference<T> {

    protected testValue(value: any, type?: ValueType | RegExp): any {
        if (type instanceof RegExp) {
            return typeof value === 'string' && type.test(value)
        }
        switch (type) {
            case 'exist':
                return value !== undefined
            case 'true':
                return Boolean(value)
            case 'false':
                return !Boolean(value)
            case 'boolean':
                return typeof value === 'boolean'
            case 'object':
                return Object.prototype.toString.call(value) === '[object Object]'
            case 'function':
                return Object.prototype.toString.call(value) === '[object Function]'
            case 'array':
                return Array.isArray(value)
            case 'nonEmptyArray':
                return Array.isArray(value) && value.length
            case 'string':
                return typeof value === 'string'
            case 'nonEmptyString':
                return typeof value === 'string' && value
            case 'number':
                return typeof value === 'number'
            case 'nonZeroNumber':
                return typeof value === 'number' && value
            case 'null':
                return value === null
            case 'nonNull':
                return value !== null
            default:
                return value !== undefined
        }
    }

    protected any(value: any, types: (ValueType | RegExp)[]) {
        for (const type of types) {
            if (this.testValue(value, type)) {
                return true
            }
        }
        return false
    }

    protected all(value: any, types: (ValueType | RegExp)[]) {
        for (const type of types) {
            if (!this.testValue(value, type)) {
                return false
            }
        }
        return true
    }
}
