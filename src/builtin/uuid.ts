import crypto from 'crypto'
import { Component } from '../tora-component'

class UUIDUtils {

    private byteToHex: string[] = []
    private rnds8Pool = new Uint8Array(256) // # of random values to pre-allocate
    private poolPtr = this.rnds8Pool.length

    constructor() {
        for (let i = 0; i < 256; ++i) {
            this.byteToHex.push((i + 0x100).toString(16).substr(1))
        }
    }

    stringify(arr: number[], offset = 0) {
        return (
            this.byteToHex[arr[offset]] +
            this.byteToHex[arr[offset + 1]] +
            this.byteToHex[arr[offset + 2]] +
            this.byteToHex[arr[offset + 3]] +
            this.byteToHex[arr[offset + 4]] +
            this.byteToHex[arr[offset + 5]] +
            this.byteToHex[arr[offset + 6]] +
            this.byteToHex[arr[offset + 7]] +
            this.byteToHex[arr[offset + 8]] +
            this.byteToHex[arr[offset + 9]] +
            this.byteToHex[arr[offset + 10]] +
            this.byteToHex[arr[offset + 11]] +
            this.byteToHex[arr[offset + 12]] +
            this.byteToHex[arr[offset + 13]] +
            this.byteToHex[arr[offset + 14]] +
            this.byteToHex[arr[offset + 15]]
        ).toLowerCase()
    }

    rng() {
        if (this.poolPtr > this.rnds8Pool.length - 16) {
            crypto.randomFillSync(this.rnds8Pool)
            this.poolPtr = 0
        }
        return this.rnds8Pool.slice(this.poolPtr, (this.poolPtr += 16))
    }
}

const seedBytes = new UUIDUtils().rng()

let _nodeId = [
    seedBytes[0] | 0x01,
    seedBytes[1],
    seedBytes[2],
    seedBytes[3],
    seedBytes[4],
    seedBytes[5],
]

let _clockseq = ((seedBytes[6] << 8) | seedBytes[7]) & 0x3fff

/**
 * @author plankroot
 * @class Generate a uuid as 32bytes char sequence.
 *
 * @example
 * class TestRouter {
 *
 *     @Post()
 *     async test(
 *         id: UUID
 *     ) {
 *
 *         return { id }
 *     }
 * }
 */
@Component()
export class UUID extends String {

    private static _lastMSecs = 0
    private static _lastNSecs = 0
    private static _util = new UUIDUtils()

    private readonly _id: string

    constructor() {
        super()

        this._id = this.uuid()
    }

    uuid() {
        let i = 0
        const b = new Array(16)
        let node = _nodeId
        let clockseq = _clockseq
        let msecs = Date.now()
        let nsecs = UUID._lastNSecs + 1
        const dt = msecs - UUID._lastMSecs + (nsecs - UUID._lastNSecs) / 10000

        if (dt < 0) {
            clockseq = (clockseq + 1) & 0x3fff
        }

        if ((dt < 0 || msecs > UUID._lastMSecs)) {
            nsecs = 0
        }

        if (nsecs >= 10000) {
            throw new Error('Can\'t create more than 10M uuids/sec')
        }

        UUID._lastMSecs = msecs
        UUID._lastNSecs = nsecs
        _clockseq = clockseq

        msecs += 12219292800000

        const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000
        b[i++] = (tl >>> 24) & 0xff
        b[i++] = (tl >>> 16) & 0xff
        b[i++] = (tl >>> 8) & 0xff
        b[i++] = tl & 0xff

        const tmh = ((msecs / 0x100000000) * 10000) & 0xfffffff
        b[i++] = (tmh >>> 8) & 0xff
        b[i++] = tmh & 0xff

        b[i++] = ((tmh >>> 24) & 0xf) | 0x10
        b[i++] = (tmh >>> 16) & 0xff

        b[i++] = (clockseq >>> 8) | 0x80

        b[i++] = clockseq & 0xff

        for (let n = 0; n < 6; ++n) {
            b[i + n] = node[n]
        }

        return UUID._util.stringify(b)
    }

    valueOf() {
        return this._id
    }

    toString() {
        return this._id
    }
}
