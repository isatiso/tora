```typescript
import { Tora } from 'tora'

@Tora.Trigger({
    imports: [
        SampleDependency1,
        SampleDependency2,
    ],
    providers: [
        SampleComponent1,
        SampleComponent2,
    ],
})
export class SampleTrigger {

    constructor(
        public sc1: SampleComponent1,
        private sc2: SampleComponent2,
    ) {
    }

    @Task('*/5 * * * *')
    async sample_task() {
        this.sc1.do_something()
        this.sc2.do_something()
        return 'OK'
    }
}
```
