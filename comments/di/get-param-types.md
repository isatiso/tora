```typescript
import { ToraRouter } from 'tora'

export function SomeCustomDecorator() {
    return function (target: any, key: string, desc: PropertyDescriptor) {
        const param_types = AnnotationTools.get_param_types(target, key)
        console.log(param_types)
        // do something useful。
    }
}

@ToraRouter('/')
class TestRouter {

    constructor() {
    }

    /**
     * 这里使用上面定义的装饰器，拿到的 param_types 如下：
     * param_types => [
     *     [class SessionContext],
     *     [class ApiParams extends Judgement]
     * ]
     */
    @SomeCustomDeractor()
    async test(
        cs: SessionContext,
        params: ApiParams<{
            a: string
            b: number
        }>
    ) {
        return 'OK'
    }
}
```
