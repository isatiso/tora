/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Provider } from '../types'
import { _NullInjector, NullInjector } from './null-injector'
import { InjectorProvider } from './provider'

/**
 * @private
 *
 * 注入器，用于查找依赖。
 *
 * @category Injector
 */
export class Injector {

    provider?: InjectorProvider
    readonly children: Injector[] = []

    constructor(
        public parent: Injector | _NullInjector,
        public providers: Map<any, any> = new Map()
    ) {
    }

    /**
     * 从父注入器创建一个新的注入器。
     *
     * @param parent 父注入器
     * @param providers 默认的 Provider
     */
    static create(parent?: Injector | null, providers?: Map<any, any>): Injector {
        providers = providers || new Map()
        const real_parent = parent ?? NullInjector
        const new_instance = new Injector(real_parent, providers)
        real_parent.children.push(new_instance)
        return new_instance
    }

    /**
     * 向注入器中注册指定的 token 和 provider 的映射关系。
     *
     * @param token
     * @param provider
     */
    set_provider(token: any, provider: Provider<any>) {
        this.providers.set(token, provider)
    }

    /**
     * 根据 token 查找依赖。
     *
     * @param token
     * @param info 一些帮助调试的信息
     */
    get(token: any, info?: string): Provider<any> {
        if (token === Injector) {
            if (!this.provider) {
                this.provider = new InjectorProvider('injector', this)
            }
            return this.provider
        }
        return this.providers.get(token) ?? this.parent.get(token, info)
    }

    /**
     * 仅在注入器本身进行查找依赖，不向上查找。
     *
     * @param token
     */
    local_has(token: any): boolean {
        if (token === Injector) {
            return true
        }
        return this.providers.has(token)
    }

    /**
     * 查找依赖，返回依赖是否存在。
     *
     * @param token
     */
    has(token: any): boolean {
        if (token === Injector) {
            return true
        }
        return this.providers.has(token) || this.parent.has(token)
    }
}
