```typescript
import { AnnotationTools, Meta, ToraRouter } from 'tora'

// 这里实现一个向 ToraRouter 添加一个单结果查询的 API 的装饰器。
export const GetOneApi = AnnotationTools.create_decorator(
    (target: any, meta?: ApiMetaOptions<any>, options?: {
        id_field?: string // 指定需要作为 ID 进行查询的字段。
        projection?: string[] // 指定结果集需要的字段。
    }) => {

        // 这里查询需要注入对应的数据库查询服务。
        // 需要注意的是为了进行编译时期检查，这里会检查是否通过装饰器 `Meta` 传入了对应的查询服务。
        if (!meta?.dao) {
            throw new Error(`[dao] not found in meta of ${target}`)
        }

        const desc: HandlerDescriptor = {
            // 设置请求方法及请求路径
            method_and_path: { 'POST-get-one': ['POST', 'get-one'] },
            auth: true, // 需要进行认证
            wrap_result: true, // 需要对结果进行默认包裹
            pos: '', // 代码中的位置，调试时可以帮助定位问题
            param_types: [meta.dao, ApiParams], // 注入的实例列表
            property_key: 'get_one',
            handler: async function (dao: BaseMongo<any>, params: ApiParams<{
                id: string | number
            }>) {
                // 检查要求 id 字段必须存在
                const id = params.ensure('id')

                // 索引字段，优先使用直接传入的 key，其次使用 `Meta` 设置的 key，最后使用 `_id`
                const id_field = options?.id_field ?? meta?.id_field ?? '_id'
                const queryOptions: DaoQueryOptions<any> = {}

                // 设置查询选项
                if (options?.projection) {
                    queryOptions.projection = options.projection
                }

                // 进行查询并返回结果
                return await dao.getOne({ [id_field]: id }, queryOptions)
            }
        }

        // 添加监听函数
        AnnotationTools.add_handler(target.prototype, desc)
    })

/**
 * 像下面这样添加 `GetOneApi` 装饰器，可以向 TestRouter 添加一个 API。
 * 由于 `GetOneApi` 检查了 `Meta` 传入的参数，需要保证 `Meta` 先执行。
 * 也就是说 `Meta` 要在 `GetOneApi` 的下面。
 */
@GetOneApi()
@Meta({ id_field: '_id', dao: MongoQueryService })
@ToraRouter('/')
class TestRouter {

    constructor() {
    }
}
```
