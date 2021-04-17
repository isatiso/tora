/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../token'
import { HandlerDescriptor } from '../types'

/**
 * 一些用于开发自定义装饰器的工具函数。
 *
 * @category AnnotationTools
 */
export namespace AnnotationTools {

    /**
     * 用于创建自定义装饰器。
     *
     * [[include:di/create-decorator.md]]
     *
     * @param processor 自定义装饰器的处理函数。
     * @return decorator 新的装饰器。
     */
    export function create_decorator<T>(processor: (constructor: any, meta: any, options?: T) => void) {
        return function(options?: T) {
            return function(constructor: any) {
                const meta = TokenUtils.ClassMeta.getset(constructor, {})
                processor(constructor, meta, options)
            }
        }
    }

    /**
     * 获取成员函数参数的类型列表。
     *
     * [[include:di/get-param-types.md]]
     *
     * @param proto Tora 组件类的原型。
     * @param property_key 成员函数名。
     * @return type_list 类型列表。
     */
    export function get_param_types(proto: any, property_key: string) {
        const inject_token_map = TokenUtils.ParamInjection.get(proto, property_key)
        return TokenUtils.getParamTypes(proto, property_key)?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
    }

    /**
     * 通过处理函数描述对象 `HandlerDescriptor` 创建监听函数。
     *
     * 使用方式参考 [[AnnotationTools.add_handler]]
     *
     * @param proto Tora 组件类原型
     * @param desc 处理函数描述对象
     * @return
     */
    export function add_handler(proto: any, desc: HandlerDescriptor): void {
        TokenUtils.ToraRouterHandlerList.getset(proto, [])?.push(desc)
    }

    /**
     * 查询自定义数据。
     * 自定义数据是一个挂在目标 Class 原型上的一个对象，可以通过 index 获取对应内容。
     *
     * @param proto Tora 组件类原型
     * @param index 内容索引
     * @return data 查询结果
     */
    export function get_custom_data<T>(proto: any, index: string): T | undefined {
        return TokenUtils.CustomData.get(proto)?.[index]
    }

    /**
     * 添加自定义数据。
     * 自定义数据是一个挂在目标 Class 原型上的一个对象，可以通过 index 获取对应内容。
     *
     * @param proto Tora 组件类原型
     * @param index 内容索引
     * @param data 需要设置的内容
     * @return
     */
    export function define_custom_data<T = any>(proto: any, index: string, data: T) {
        TokenUtils.CustomData.getset(proto, {})[index] = data
    }
}

