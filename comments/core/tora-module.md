```typescript
import { Tora } from 'tora'

@Tora.Module({
    imports: [
        SampleDependency1,
        SampleDependency2,
    ],
    providers: [
        SampleComponent1,
        SampleComponent2,
    ],
})
class SampleModule {

}
```
