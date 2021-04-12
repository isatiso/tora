export class ParsedFields extends Array {

    get second(): Readonly<(string | number)[]> {
        return this[0]
    }

    get minute(): Readonly<(string | number)[]> {
        return this[1]
    }

    get hour(): Readonly<(string | number)[]> {
        return this[2]
    }

    get dayOfMonth(): Readonly<(string | number)[]> {
        return this[3]
    }

    get month(): Readonly<(string | number)[]> {
        return this[4]
    }

    get dayOfWeek(): Readonly<(string | number)[]> {
        return this[5]
    }

    constructor(fields: (string | number)[][]) {
        super()
        this.push(...fields)
    }
}
