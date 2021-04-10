import { Dayjs } from 'dayjs'
import { Schedule } from './schedule'

export class Bullet {
    constructor(
        public crontab: Schedule,
        public handler: Function,
        public execution: Dayjs,
        public next_bullet: Bullet | null,
    ) {
    }
}
