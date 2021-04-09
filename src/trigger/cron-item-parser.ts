export type FieldType = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

const VALUE_RANGE = {
    month: { min: 1, max: 12 },
    dayOfMonth: { min: 1, max: 31 },
    dayOfWeek: { min: 0, max: 7 },
    hour: { min: 0, max: 23 },
    minute: { min: 0, max: 59 },
    second: { min: 0, max: 59 },
}

const MONTH_ALIAS: { [prop: string]: number } = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
}

const WEEK_ALIAS: { [prop: string]: number } = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
}

const rangeRegex = /^([0-9]{1,2}|[0-9]{1,2}-[0-9]{1,2}|[0-9]{1,2}\/[0-9]{1,2}|[0-9]{1,2}-[0-9]{1,2}\/[0-9]{1,2})$/
const dayOfWeekSpecial = /^([0-7]#[1-5]|[0-7]l)$/
const dayOfMonthSpecial = /^(l|[1-9]w|[012][0-9]w|3[01]w|wl|lw)$/

function generateSequence(start: number, end: number, step: number, value_type: FieldType) {
    if (end < start) {
        throw new Error(`Constraint error, Invalid range: ${start}-${end}.'`)
    }
    if (start < VALUE_RANGE[value_type].min || end > VALUE_RANGE[value_type].max) {
        throw new Error(`Constraint error, got range ${start}-${end}, expected range ${VALUE_RANGE[value_type].min}-${VALUE_RANGE[value_type].max}.'`)
    }
    const res: number[] = []
    for (let i = start; i <= end; i += step) {
        res.push(i)
    }
    return res
}

export function parseRange(value: string, value_type: FieldType): number[] {
    if (value.indexOf('/') !== -1) {
        const [range, step] = value.split('/')
        if (range.indexOf('-') !== -1) {
            const [start, stop] = range.split('-')
            return generateSequence(+start, +stop, +step, value_type)
        } else {
            return generateSequence(+range, VALUE_RANGE[value_type].max, +step, value_type)
        }
    } else if (value.indexOf('-') !== -1) {
        const [start, stop] = value.split('-')
        return generateSequence(+start, +stop, 1, value_type)
    } else {
        const num = +value
        if (num < VALUE_RANGE[value_type].min || num > VALUE_RANGE[value_type].max) {
            throw new Error(`Constraint error, got value ${num}, expected range ${VALUE_RANGE[value_type].min}-${VALUE_RANGE[value_type].max}.'`)
        }
        return [+value]
    }
}

export function parseValue(value: string, value_type: FieldType): string | number[] {
    if (rangeRegex.test(value)) {
        return parseRange(value, value_type)
    } else {
        switch (value_type) {
            case 'dayOfMonth':
                if (dayOfMonthSpecial.test(value)) {
                    return value
                }
                break
            case 'dayOfWeek':
                if (dayOfWeekSpecial.test(value)) {
                    if (value.startsWith('7')) {
                        return value.replace(/^7/, '0')
                    }
                    return value
                }
                break
        }
        throw new Error(`Constraint error, wrong value ${value} for type ${value_type}.'`)
    }
}

export function parseSequence(item: string, value_type: FieldType): (number | string)[] {
    item = item.toLowerCase()
    const constraints = VALUE_RANGE[value_type]

    if (item.indexOf('*') !== -1) {
        item = item.replace(/\*/g, constraints.min + '-' + constraints.max)
    } else if (item.indexOf('?') !== -1) {
        item = item.replace(/\?/g, constraints.min + '-' + constraints.max)
    }

    switch (value_type) {
        case 'dayOfWeek':
            item = item.replace(/(sun|mon|tue|wed|thu|fri|sat)/gi, match => WEEK_ALIAS[match] + '')
            break
        case 'month':
            item = item.replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/gi, match => MONTH_ALIAS[match] + '')
            break
    }

    const set = new Set<number | string>()
    item.split(',').forEach(value => {
        const res = parseValue(value, value_type)
        if (Array.isArray(res)) {
            res.forEach(v => set.add(v))
        } else {
            set.add(res)
        }
    })
    if (value_type === 'dayOfWeek' && set.has(7)) {
        set.add(0)
        set.delete(7)
    }
    return Array.from(set).sort((a, b) => {
        const aIsNumber = typeof a === 'number'
        const bIsNumber = typeof b === 'number'
        if (aIsNumber && bIsNumber) {
            return a as number - (b as number)
        } else if (!aIsNumber && bIsNumber) {
            return 1
        } else if (aIsNumber && !bIsNumber) {
            return -1
        } else {
            return (a as string).localeCompare(b as string)
        }
    })
}
