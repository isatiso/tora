```typescript
import { Tora } from 'tora'

@Tora.ToraRoot({
    imports: [
        SampleDependency1,
        SampleDependency2,
    ],
    providers: [
        SampleComponent1,
        SampleComponent2,
    ],
    routers: [
        SampleToraRouter1,
        SampleToraRouter2,
    ],
    tasks: [
        SampleToraTrigger1,
        SampleToraTrigger2,
    ]
})
class SampleRoot {

}
```
