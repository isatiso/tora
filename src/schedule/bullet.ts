/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dayjs } from 'dayjs'
import { TaskDescriptor } from '../types'
import { Schedule } from './schedule'

export class Bullet {
    constructor(
        public crontab: Schedule,
        public handler: Function,
        public execution: Dayjs,
        public next_bullet: Bullet | null,
        public desc: TaskDescriptor,
    ) {
    }
}
