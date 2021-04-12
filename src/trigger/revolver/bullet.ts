import { Dayjs } from 'dayjs'
import { Schedule } from '../cron'

export class Bullet {
    constructor(
        public crontab: Schedule,
        public handler: Function,
        public execution: Dayjs,
        public next_bullet: Bullet | null,
    ) {
    }
}
