import { Dayjs } from 'dayjs'
import { CronExpression } from './cron-expression'

export class Bullet {
    constructor(
        public crontab: CronExpression,
        public handler: Function,
        public execution: Dayjs,
        public next_bullet: Bullet | null,
    ) {
    }
}
