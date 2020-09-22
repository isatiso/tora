import { throw_fm_panic } from '../error'
import { KeyOfFilterType } from '../type'
import { SessionContext } from './context'

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

class Reference<T> {

    constructor(public data: T) {
    }

    get<P extends keyof T>(prop: P): T[P] | undefined;
    get<P extends keyof T>(prop: P, def: T[P]): Exclude<T[P], undefined> ;
    get<P extends keyof T>(prop: P, def?: T[P]): T[P] | undefined {
        return this.data[prop] ?? def
    }
}

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

export class ApiParams<T> extends Judgement<T> {

    getIf<P extends keyof T>(prop: P, match: ValueType | RegExp): T[P] | undefined
    getIf<P extends keyof T>(prop: P, match: ValueType | RegExp, def: T[P]): T[P]
    getIf<P extends keyof T>(prop: P, match: ValueType | RegExp, def?: T[P]) {
        const res = super.get(prop)
        if (res !== undefined && this.testValue(res, match)) {
            return res
        }
        return def
    }

    getIfAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P] | undefined
    getIfAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], def: T[P]): T[P]
    getIfAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], def?: T[P]) {
        const res = super.get(prop)
        if (res !== undefined && this.any(res, match)) {
            return res
        }
        return def
    }

    getIfAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P] | undefined
    getIfAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], def: T[P]): T[P]
    getIfAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], def?: T[P]) {
        const res = super.get(prop)
        if (res !== undefined && this.all(res, match)) {
            return res
        }
        return def
    }

    ensureAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P] {
        const res = super.get(prop)
        if (res === undefined) {
            throw_fm_panic(400, `Can not find ${prop}`)
        }
        if (this.any(res, match)) {
            return res
        }
        throw_fm_panic(400, `prop "${prop}" is illegal.`)
    }

    ensureAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P] {
        const res = super.get(prop)
        if (res === undefined) {
            throw_fm_panic(400, `Can not find ${prop}`)
        }
        if (this.all(res, match)) {
            return res
        }
        throw_fm_panic(400, `prop "${prop}" is illegal.`)
    }

    ensure<P extends keyof T>(prop: P, match?: ValueType | RegExp): T[P] {
        match = match || 'exist'
        const res = super.get(prop)
        if (res === undefined) {
            throw_fm_panic(400, `Can not find ${prop}`)
        }
        if (this.testValue(res, match)) {
            return res
        }
        throw_fm_panic(400, `prop "${prop}" is illegal.`)
    }

    diveDeepOrUndefined<P extends KeyOfFilterType<T, object>>(prop: P): ApiParams<T[P]> | undefined {
        const res = super.get(prop)
        if (res !== undefined && this.testValue(res, 'object')) {
            return new ApiParams(res)
        }
        return undefined
    }

    diveDeep<P extends KeyOfFilterType<T, object>>(prop: P): ApiParams<T[P]> {
        const res = super.get(prop)
        if (res !== undefined && this.testValue(res, 'object')) {
            return new ApiParams(res)
        }
        throw_fm_panic(400, `"${prop}" not found.`)
    }

    // parseProduct<P extends KeyOfFilterType<T, ProductConfig>>(prop: P): ProductDescriptor
    // parseProduct<P extends KeyOfFilterType<T, ProductConfig>>(prop: P, maybe: true): ProductDescriptor | undefined
    // parseProduct<P extends KeyOfFilterType<T, ProductConfig>>(prop: P, maybe?: true): ProductDescriptor | undefined {
    //     const res = super.get(prop)
    //     if (res !== undefined && this.testValue(res, 'object')) {
    //         return new ProductDescriptor(res)
    //     }
    //     if (!maybe) {
    //         throw_fm_panic(400, `"${prop}" not found.`)
    //     } else {
    //         return undefined
    //     }
    // }

    doIfAny<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], then?: (res: T[P]) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.any(res, match)) {
            then?.(res)
        }
    }

    doIfAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[], then?: (res: T[P]) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.all(res, match)) {
            then?.(res)
        }
    }

    doIf<P extends keyof T>(prop: P, match: ValueType | RegExp, then?: (res: T[P]) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.testValue(res, match)) {
            then?.(res)
        }
    }

}

export function testApiParams(
    cs: SessionContext,
    params: ApiParams<{
        int: number
        str: string
        bool: boolean
        obj: {
            int: number
            str: string
        }
        // product: ProductConfig
    }>) {

    // Usage:

    params.ensure('str', 'string')
    params.ensureAny('str', ['string', 'number'])
    params.ensureAll('str', ['string', 'number'])
    params.getIf('str', 'string')
    params.getIf('str', 'string', 'foo')
    params.getIfAny('str', ['string', 'number'])
    params.getIfAny('str', ['string', 'number'], 'foo')
    params.getIfAll('str', ['string', 'number'])
    params.getIfAll('str', ['string', 'number'], 'foo')

    // params.parseProduct('product')
    // params.parseProduct('product', true)

    params.diveDeepOrUndefined('obj')
    params.diveDeep('obj')

    params.doIf('str', 'string', str => console.log(str))
    params.doIfAny('str', ['string', 'number'], str => console.log(str))
    params.doIfAll('str', ['string', 'number'], str => console.log(str))
}
