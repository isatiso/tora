```typescript
import { ToraTrigger, Task } from 'tora'

@ToraTrigger({
    providers: [
        // 这里的 SomeTaskLockImpl 需要自己实现。
        { provide: TaskLock, useClass: SomeTaskLockImpl },
    ]
})
class TestTrigger {

    constructor() {
    }

    /**
     * @Lock: 这里标记了锁的元信息，使用 key 唯一确定一把锁，并期望 300 秒后锁自动解开。
     *        具体的锁行为通过实现 TaskLock 类，并注入服务实现。
     * @Taks: 这里的 @Task 将 `TestTrigger.test` 标记为一个定时任务。
     *        '*\/5 * * * *' 表示每 5 分钟执行一次。
     */
    @Lock({ key: 'some_unique_key', expires: 300 })
    @Task('*/5 * * * *')
    async test() {
        console.log('do something.')
    }
}
```
