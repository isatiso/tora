/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { throw_reasonable } from '../error'
import { Judgement, Path, PathValue, ValueType } from './judgement'

/**
 * 内置请求参数解析及检查工具。
 *
 * @category Builtin
 */
export class ApiParams<T> extends Judgement<T> {

    /**
     * 参数检查，是否匹配目标的 [类型/正则表达式]。
     *
     * - 匹配则返回参数本身。
     * - 不匹配返回 `undefined`。
     *
     * @param prop 需要匹配的属性
     * @param match 预设类型或者正则表达式
     */
    getIf<P extends Path<T>>(prop: P, match: ValueType | RegExp): PathValue<T, P> | undefined
    /**
     * 参数检查，是否匹配目标的 [类型/正则表达式]。
     *
     * - 匹配则返回参数本身。
     * - 不匹配返回默认值。
     *
     * @param prop 需要匹配的属性
     * @param match 预设类型或者正则表达式
     * @param def 默认值
     */
    getIf<P extends Path<T>>(prop: P, match: ValueType | RegExp, def: PathValue<T, P>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends Path<T>>(prop: P, match: ValueType | RegExp, def?: PathValue<T, P>) {
        const res = super.get(prop)
        if (res !== undefined && this.testValue(res, match)) {
            return res
        }
        return def
    }

    /**
     * 参数检查，是否匹配多个 [类型/正则表达式] 中的任意一个。
     *
     * - 匹配则返回参数本身。
     * - 不匹配返回默认值。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     */
    getIfAny<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[]): PathValue<T, P> | undefined
    /**
     * 参数检查，是否匹配多个 [类型/正则表达式] 中的任意一个。
     *
     * - 匹配则返回参数本身。
     * - 不匹配返回默认值。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     * @param def 默认值
     */
    getIfAny<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[], def: PathValue<T, P>): Exclude<PathValue<T, P>, undefined>
    getIfAny<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[], def?: PathValue<T, P>) {
        const res = super.get(prop)
        if (res !== undefined && this.any(res, match_list)) {
            return res
        }
        return def
    }

    /**
     * 参数检查，是否匹配全部 [类型/正则表达式]。
     *
     * - 匹配则返回参数本身。
     * - 不匹配返回默认值。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     */
    getIfAll<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[]): PathValue<T, P> | undefined
    /**
     * 参数检查，是否匹配全部 [类型/正则表达式]。
     *
     * - 匹配则返回参数本身。
     * - 不匹配返回默认值。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     * @param def 默认值
     */
    getIfAll<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[], def: PathValue<T, P>): Exclude<PathValue<T, P>, undefined>
    getIfAll<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[], def?: PathValue<T, P>) {
        const res = super.get(prop)
        if (res !== undefined && this.all(res, match_list)) {
            return res
        }
        return def
    }

    /**
     * 参数检查，是否匹配目标的 [类型/正则表达式]，不匹配则抛出错误信息。
     *
     * @param prop 需要匹配的属性
     * @param match 预设类型或者正则表达式
     */
    ensure<P extends Path<T>>(prop: P, match?: ValueType | RegExp): Exclude<PathValue<T, P>, undefined> {
        match = match || 'exist'
        const res = super.get(prop)
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`)
        }
        if (this.testValue(res, match)) {
            return res as any
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`)
    }

    /**
     * 参数检查，是否匹配多个 [类型/正则表达式] 中的任意一个，不匹配则抛出错误信息。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     */
    ensureAny<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[]): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`)
        }
        if (this.any(res, match_list)) {
            return res as any
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`)
    }

    /**
     * 参数检查，是否匹配全部 [类型/正则表达式]，不匹配则抛出错误信息。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     */
    ensureAll<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[]): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        if (res === undefined) {
            throw_reasonable(400, `Can not find ${prop}`)
        }
        if (this.all(res, match_list)) {
            return res as any
        }
        throw_reasonable(400, `prop "${prop}" is illegal.`)
    }

    /**
     * 参数检查，是否匹配目标的 [类型/正则表达式]，如果匹配则执行操作。
     *
     * @param prop 需要匹配的属性
     * @param match 预设类型或者正则表达式
     * @param then 回调函数
     */
    doIf<P extends Path<T>>(prop: P, match: ValueType | RegExp, then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.testValue(res, match)) {
            then?.(res)
        }
    }

    /**
     * 参数检查，是否匹配多个 [类型/正则表达式] 中的任意一个，如果匹配则执行操作。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     * @param then 回调函数
     */
    doIfAny<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[], then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.any(res, match_list)) {
            then?.(res)
        }
    }

    /**
     * 参数检查，是否匹配全部 [类型/正则表达式]，如果匹配则执行操作。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个类型或者正则表达式
     * @param then 回调函数
     */
    doIfAll<P extends Path<T>>(prop: P, match_list: (ValueType | RegExp)[], then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.all(res, match_list)) {
            then?.(res)
        }
    }
}
