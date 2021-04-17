```typescript
import { Tora } from 'tora'

@Tora.Router('/test', {
    imports: [
        SampleDependency1,
        SampleDependency2,
    ],
    providers: [
        SampleComponent1,
        SampleComponent2,
    ],
})
export class SampleRouter {

    constructor(
        public sc1: SampleComponent1,
        private sc2: SampleComponent2,
    ) {
    }

    @Get('test-get')
    async test_get_method() {
        return 'OK'
    }
}
```
