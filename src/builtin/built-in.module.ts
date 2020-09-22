import { FmModule } from '../fm-module'
import { CurrentTimestamp } from './current-timestamp'
import { UUID } from './uuid'

@FmModule({
    providers: [
        { provide: CurrentTimestamp, useClass: CurrentTimestamp, multi: true },
        { provide: UUID, useClass: UUID, multi: true },
    ]
})
export class BuiltInModule {

}
