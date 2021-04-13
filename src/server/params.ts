/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { throw_reasonable } from '../error'
import { KeyOfFilterType } from '../types'
import { Judgement, ValueType } from './params-lib'
import { SessionContext } from './session-context'

/**
 * Parameter definition and checker.
 *
 * @category API Injectable
 */
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
            throw_reasonable(400, `Can not find ${prop}`)
        }
        if (this.any(res, match)) {
            return res
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`)
    }

    ensureAll<P extends keyof T>(prop: P, match: (ValueType | RegExp)[]): T[P] {
        const res = super.get(prop)
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`)
        }
        if (this.all(res, match)) {
            return res
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`)
    }

    ensure<P extends keyof T>(prop: P, match?: ValueType | RegExp): T[P] {
        match = match || 'exist'
        const res = super.get(prop)
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`)
        }
        if (this.testValue(res, match)) {
            return res
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`)
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
        throw_reasonable(400, `"${prop}" not found.`)
    }

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
    }>) {

    params.ensure('str', 'string')
    params.ensureAny('str', ['string', 'number'])
    params.ensureAll('str', ['string', 'number'])
    params.getIf('str', 'string')
    params.getIf('str', 'string', 'foo')
    params.getIfAny('str', ['string', 'number'])
    params.getIfAny('str', ['string', 'number'], 'foo')
    params.getIfAll('str', ['string', 'number'])
    params.getIfAll('str', ['string', 'number'], 'foo')

    params.diveDeepOrUndefined('obj')
    params.diveDeep('obj')

    params.doIf('str', 'string', str => console.log(str))
    params.doIfAny('str', ['string', 'number'], str => console.log(str))
    params.doIfAll('str', ['string', 'number'], str => console.log(str))
}
