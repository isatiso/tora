```typescript
import { Disabled, Post, ToraRouter, EchoDependencies, SessionContext, ApiParams } from 'tora'

/**
 * 加载时会输出：
 * TestRouter dependencies [
 *      [class SomeDependency1],
 *      [class SomeDependency2],
 *      [class SomeDependency3],
 * ]
 */
@EchoDependencies()
@ToraRouter('/')
class TestRouter {

    constructor(
        private dependency1: SomeDependency1,
        private dependency2: SomeDependency2,
        private dependency3: SomeDependency3,
    ) {
    }

    /**
     * 加载时会输出：
     * TestRouter.test dependencies [
     *     [class SessionContext],
     *     [class ApiParams extends Judgement]
     * ]
     */
    @EchoDependencies()
    @Post()
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
