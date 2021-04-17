```typescript
import { Disabled, Post, ToraRouter } from 'tora'

@ToraRouter('/')
class TestRouter {

    constructor() {
    }

    // 这里标记为 `@Disabled()` 之后，加载 `TestRouter` 时，test 方法，将不会添加为监听函数。
    @Disabled()
    @Post()
    async test() {
        return 'OK'
    }
}
```
