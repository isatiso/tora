import dayjs, { Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { FieldType, parseSequence } from './cron-item-parser'
import { CronSchedule } from './cron-schedule'

dayjs.extend(utc)
dayjs.extend(timezone)

interface CronExpressionOptions {
    currentDate?: Date
    startDate?: Date
    endDate?: Date
    utc?: boolean
    tz?: string
}

interface InnerOptions {
    _is_day_of_month_wildcard_match?: boolean
    _is_day_of_week_wildcard_match?: boolean
}

type MappedFields = { [K in FieldType]: (string | number)[] }

export class CronExpression {

    static readonly map: FieldType[] = ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
    static readonly parseDefaults = ['0', '*', '*', '*', '*', '*']
    static readonly predefined: { [prop: string]: string } = {
        '@yearly': '0 0 1 1 *',
        '@monthly': '0 0 1 * *',
        '@weekly': '0 0 * * 0',
        '@daily': '0 0 * * *',
        '@hourly': '0 * * * *'
    }
    private readonly _utc: boolean
    private readonly _tz?: string
    private readonly _is_day_of_month_wildcard_match: boolean = false
    private readonly _is_day_of_week_wildcard_match: boolean = false
    private _year!: number
    private _month!: number
    private _now!: Dayjs
    private _schedule!: CronSchedule

    constructor(
        private readonly fields: MappedFields,
        private readonly options?: CronExpressionOptions & InnerOptions,
    ) {
        this._utc = options?.utc ?? false
        this._tz = this._utc ? 'UTC' : options?.tz
        this._is_day_of_month_wildcard_match = options?._is_day_of_month_wildcard_match ?? false
        this._is_day_of_week_wildcard_match = options?._is_day_of_week_wildcard_match ?? false
        this.init()
    }

    static parse(expression: string, options?: CronExpressionOptions & InnerOptions) {

        options = options ?? {}
        if (CronExpression.predefined[expression]) {
            expression = CronExpression.predefined[expression]
        }
        const fields: (string | number)[][] = []
        const atoms = expression.trim().split(/\s+/)
        if (atoms.length > 6) {
            throw new Error('Invalid cron expression')
        }

        if (atoms[atoms.length - 1] === '*' || atoms[atoms.length - 1] === '?') {
            options._is_day_of_week_wildcard_match = true
        }

        if (atoms[atoms.length - 3] === '*' || atoms[atoms.length - 3] === '?' || atoms[atoms.length - 3] === undefined) {
            options._is_day_of_month_wildcard_match = true
        }

        const start = CronExpression.map.length - atoms.length
        for (let i = 0, c = CronExpression.map.length; i < c; i++) {
            const field = CronExpression.map[i]
            const value = atoms[i - start]
            if (!value) {
                fields.push(parseSequence(CronExpression.parseDefaults[i], field))
            } else {
                fields.push(parseSequence(value, field))
            }
        }

        const mappedFields: Partial<MappedFields> = {}
        for (let i = 0, c = CronExpression.map.length; i < c; i++) {
            const key = CronExpression.map[i]
            mappedFields[key] = fields[i]
        }

        return new CronExpression(mappedFields as MappedFields, options)
    }

    next() {
        while (true) {
            const res = this._schedule.next()
            if (!res) {
                this._now = this._now.add(1, 'month').startOf('month')
                this._change_next_month()
                this._schedule = this._make_schedule()
            } else {
                this._now = res
                return res
            }
        }
    }

    init() {
        this._now = dayjs().tz(this._tz)
        this._year = this._now.year()
        this._month = this._now.month() + 1
        if (!this.fields.month.includes(this._month)) {
            this._change_next_month()
        }
        this._schedule = this._make_schedule()
    }

    private _change_next_month() {
        for (const m of this.fields.month) {
            if (m > this._month) {
                this._month = m as number
                this._now = this._now.set('month', this._month - 1)
                return
            }
        }
        this._month = this.fields.month[0] as number
        this._year++
        this._now = this._now.add(1, 'year').startOf('year').set('month', this._month - 1)
    }

    private _make_schedule(): CronSchedule {
        const schedule = new Set<number>()
        const current = dayjs(`${this._year}-${this._month}`).tz(this._tz)
        const days_in_month = current.daysInMonth()
        if (!this._is_day_of_month_wildcard_match || this._is_day_of_week_wildcard_match) {
            const day_of_month = Array.from(this.fields.dayOfMonth)
            while (day_of_month.length) {
                const ele = day_of_month.pop()
                if (ele === undefined) {
                    break
                } else if (typeof ele === 'number') {
                    if (ele >= 1 && ele <= days_in_month) {
                        schedule.add(ele)
                    }
                } else if (ele === 'l') {
                    schedule.add(days_in_month)
                } else if (/^[1-9]w|[0-3][0-9]w|lw|wl$/.test(ele)) {
                    let w_date = ele.indexOf('l') !== -1 ? days_in_month : +ele.replace('w', '')
                    if (w_date > days_in_month) {
                        w_date = days_in_month
                    }
                    const target = current.set('date', w_date)
                    if (target.date() === 1 && target.day() === 6) {
                        schedule.add(3)
                    } else if (target.date() === days_in_month && target.day() === 0) {
                        schedule.add(days_in_month - 2)
                    } else if (target.day() === 6) {
                        schedule.add(w_date - 1)
                    } else if (target.day() === 0) {
                        schedule.add(w_date + 1)
                    } else {
                        schedule.add(w_date)
                    }
                }
            }
        }
        if (!this._is_day_of_week_wildcard_match) {
            const day_of_week = Array.from(this.fields.dayOfWeek)
            const first_day_obj = current.set('date', 1)
            const matrix: number[][] = [[], [], [], [], [], [], []]
            for (let date = 1, wd = first_day_obj.day(); date <= days_in_month; date++) {
                matrix[wd].push(date)
                wd++
                if (wd === 7) {
                    wd = 0
                }
            }
            while (day_of_week.length) {
                const ele = day_of_week.pop()
                if (ele === undefined) {
                    break
                } else if (typeof ele === 'number') {
                    if (0 <= ele && ele <= 6) {
                        matrix[ele].forEach(d => schedule.add(d))
                    }
                } else if (ele.indexOf('#') !== -1) {
                    const [w, c] = ele.split('#')
                    const d = matrix[+w]?.[+c - 1]
                    if (d) {
                        schedule.add(d)
                    }
                } else if (ele.indexOf('l') !== -1) {
                    const w = +ele.replace('l', '')
                    if (matrix[+w]) {
                        schedule.add(matrix[+w][matrix[+w].length - 1])
                    }
                }
            }
        }
        return new CronSchedule({
            year: this._year,
            month: this._month - 1,
            day: Array.from<number>(schedule).sort((a, b) => a - b),
            hour: Array.from(this.fields.hour as number[]),
            minute: Array.from(this.fields.minute as number[]),
            second: Array.from(this.fields.second as number[]),
        }, this._now, this._tz)
    }
}
