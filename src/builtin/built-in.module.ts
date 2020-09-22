import { ToraModule } from '../tora-module'
import { CurrentTimestamp } from './current-timestamp'
import { UUID } from './uuid'

@ToraModule({
    providers: [
        { provide: CurrentTimestamp, useClass: CurrentTimestamp, multi: true },
        { provide: UUID, useClass: UUID, multi: true },
    ]
})
export class BuiltInModule {

}
