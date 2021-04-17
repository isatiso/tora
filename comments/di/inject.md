在使用 @Inject 进行注入查找前需要先注册一个 [[Provider]]。

```typescript
import { Post, ToraRouter } from 'tora'

@ToraRouter('/', {
    providers: [
        // 这里进行注册。
        { provide: 'some_token', useValue: 'value_of_some_token' }
    ]
})
class TestRouter {

    constructor() {
    }

    @Post()
    async test(
        @Inject('some_token') params: string,
    ) {
        console.log(params) // 这里会打印 'value_of_some_token'。
        return 'OK'
    }
}
```
