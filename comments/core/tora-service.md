```typescript
import { Tora } from 'tora'

@Tora.Component()
export class SampleUserService {

    constructor(
        private uuid: UUID,
        private user: SampleUserDao,
    ) {
    }

    async create(phone: string, name: string) {
        return this.user.insert({
            id: this.uuid.create(),
            phone: phone,
            name: name,
            created_at: new Date().getTime()
        })
    }
}
```
