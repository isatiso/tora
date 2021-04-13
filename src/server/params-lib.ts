export type ValueType = 'exist'
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

export const PURE_PARAMS = 'PURE_PARAMS'

/**
 * @private
 */
class Reference<T> {

    constructor(public data: T) {
    }

    get<P extends keyof T>(prop: P): T[P] | undefined;
    get<P extends keyof T>(prop: P, def: T[P]): Exclude<T[P], undefined> ;
    get<P extends keyof T>(prop: P, def?: T[P]): T[P] | undefined {
        return this.data?.[prop] ?? def
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
