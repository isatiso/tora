import dayjs, { Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface CronScheduleDesc {
    year: number
    month: number
    day: number[]
    hour: number[]
    minute: number[]
    second: number[]
}

export class CronSchedule {

    private _year: number
    private _month: number

    private _field_name: ('date' | 'hour' | 'minute' | 'second')[] = ['date', 'hour', 'minute', 'second']
    private _schedule: [number[], number[], number[], number[]] = [[], [], [], []]
    private _cur: [number, number, number, number] = [0, 0, 0, 0]
    private _current?: [number, number, number, number]
    private _has_next = true

    constructor(
        private _schedule_desc: CronScheduleDesc,
        private _now: Dayjs,
        private _tz: string | undefined
    ) {
        this._year = this._schedule_desc.year
        this._month = this._schedule_desc.month
        this._schedule[0] = this._schedule_desc.day
        this._schedule[1] = this._schedule_desc.hour
        this._schedule[2] = this._schedule_desc.minute
        this._schedule[3] = this._schedule_desc.second
        this._has_next = true
        this._align()
        this._current = [
            this._schedule[0][this._cur[0]],
            this._schedule[1][this._cur[1]],
            this._schedule[2][this._cur[2]],
            this._schedule[3][this._cur[3]],
        ]
    }

    next() {
        if (this._has_next && this._current) {
            const y = (this._year + '').padStart(2, '0')
            const m = (this._month + 1 + '').padStart(2, '0')
            const d = (this._current[0] + '').padStart(2, '0')
            const hour = (this._current[1] + '').padStart(2, '0')
            const min = (this._current[2] + '').padStart(2, '0')
            const sec = (this._current[3] + '').padStart(2, '0')
            const date = dayjs(`${y}-${m}-${d} ${hour}:${min}:${sec}`).tz(this._tz)
            this._current = this._tick()
            return date
        } else {
            return
        }
    }

    private _tick(): [number, number, number, number] | undefined {
        this._cur[3]++
        if (this._cur[3] >= this._schedule[3].length) {
            this._cur[3] = 0
            this._cur[2]++
            if (this._cur[2] >= this._schedule[2].length) {
                this._cur[2] = 0
                this._cur[1]++
                if (this._cur[1] >= this._schedule[1].length) {
                    this._cur[1] = 0
                    this._cur[0]++
                    if (this._cur[0] >= this._schedule[0].length) {
                        this._has_next = false
                        return
                    }
                }
            }
        }
        this._has_next = true
        return [
            this._schedule[0][this._cur[0]],
            this._schedule[1][this._cur[1]],
            this._schedule[2][this._cur[2]],
            this._schedule[3][this._cur[3]],
        ]
    }

    private _walk_schedule(i: number): boolean {
        const current = this._now.get(this._field_name[i])
        while (this._schedule[i][this._cur[i]] < current) {
            this._cur[i]++
        }
        if (this._schedule[i][this._cur[i]] > current) {
            for (let n = i + 1; n < this._cur.length; n++) {
                this._cur[n] = 0
            }
            return true
        } else if (this._schedule[i][this._cur[i]] === current) {
            if (i === 3) {
                return true
            }
            const direct_return = this._walk_schedule(i + 1)
            if (direct_return) {
                return direct_return
            }
            this._cur[i]++
            if (i + 1 < this._cur.length) {
                this._cur[i + 1] = 0
            }
            return this._cur[i] < this._schedule[i].length
        }
        return false
    }

    private _align() {
        if (!this._walk_schedule(0)) {
            this._has_next = false
        }
    }
}

