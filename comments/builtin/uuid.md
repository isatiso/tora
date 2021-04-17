```typescript
import { ToraComponent, Post, UUID } from 'tora'

@ToraComponent()
class TestRouter {

    constructor(
        private uuid: UUID,
    ) {
    }

    generate_id() {
        // 生成新的 id。
        const new_id = this.uuid.create()
        return { id: new_id }
    }
}
```
