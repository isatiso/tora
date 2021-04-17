```typescript
import { ToraRouter, Post, Timestamp } from 'tora'

@ToraRouter('/')
class TestRouter {

    constructor(
        // 这里是在服务加载时注入的，可以粗略的认为是服务的启动时间。
        private module_load_timestamp: Timestamp,
    ) {
    }

    @Post()
    async test(
        // 这里是在 API 调用时注入的，可以认为是 API 收到请求的时间。
        now: Timestamp
    ) {

        return {
            start_at: this.module_load_timestamp.valueOf(),

            // 可以通过隐式转换将 Timestamp 对象转换为 number。
            timestamp1: +now,

            // 或者显式调用 .valueOf() 方法将 Timestamp 对象转换为 number。
            timestamp2: now.valueOf(),
        }
    }
}
```
