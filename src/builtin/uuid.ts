/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import crypto from 'crypto'
import { Component } from '../tora-component'

class UUIDUtils {

    private byteToHex: string[] = []
    private random_8_pool = new Uint8Array(256) // # of random values to pre-allocate
    private poolPtr = this.random_8_pool.length

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
        if (this.poolPtr > this.random_8_pool.length - 16) {
            crypto.randomFillSync(this.random_8_pool)
            this.poolPtr = 0
        }
        return this.random_8_pool.slice(this.poolPtr, (this.poolPtr += 16))
    }
}

const seed_bytes = new UUIDUtils().rng()

let NODE_ID = [
    seed_bytes[0] | 0x01,
    seed_bytes[1],
    seed_bytes[2],
    seed_bytes[3],
    seed_bytes[4],
    seed_bytes[5],
]

let CLOCK_SEQ = ((seed_bytes[6] << 8) | seed_bytes[7]) & 0x3fff

/**
 * Injectable UUID implement.
 *
 * e.g.
 * ```
 * @Component()
 * class TestRouter {
 *
 *     @Post()
 *     async test(
 *         id: UUID
 *     ) {
 *         return { id }
 *     }
 * }
 * ```
 *
 * @category Builtin Component
 */
@Component()
export class UUID {

    private static _lastMSecs = 0
    private static _lastNSecs = 0
    private static _util = new UUIDUtils()

    private _id?: string
    private get id() {
        if (!this._id) {
            this._id = this.create()
        }
        return this._id
    }

    create() {
        let i = 0
        const b = new Array(16)
        let node = NODE_ID
        let clock_sequence = CLOCK_SEQ
        let milli_secs = Date.now()
        let nano_secs = UUID._lastNSecs + 1
        const dt = milli_secs - UUID._lastMSecs + (nano_secs - UUID._lastNSecs) / 10000

        if (dt < 0) {
            clock_sequence = (clock_sequence + 1) & 0x3fff
        }

        if ((dt < 0 || milli_secs > UUID._lastMSecs)) {
            nano_secs = 0
        }

        if (nano_secs >= 10000) {
            throw new Error('Can\'t create more than 10M uuids/sec')
        }

        UUID._lastMSecs = milli_secs
        UUID._lastNSecs = nano_secs
        CLOCK_SEQ = clock_sequence

        milli_secs += 12219292800000

        const tl = ((milli_secs & 0xfffffff) * 10000 + nano_secs) % 0x100000000
        b[i++] = (tl >>> 24) & 0xff
        b[i++] = (tl >>> 16) & 0xff
        b[i++] = (tl >>> 8) & 0xff
        b[i++] = tl & 0xff

        const tmh = ((milli_secs / 0x100000000) * 10000) & 0xfffffff
        b[i++] = (tmh >>> 8) & 0xff
        b[i++] = tmh & 0xff

        b[i++] = ((tmh >>> 24) & 0xf) | 0x10
        b[i++] = (tmh >>> 16) & 0xff

        b[i++] = (clock_sequence >>> 8) | 0x80

        b[i++] = clock_sequence & 0xff

        for (let n = 0; n < 6; ++n) {
            b[i + n] = node[n]
        }

        return UUID._util.stringify(b)
    }

    valueOf() {
        return this.id
    }

    toString() {
        return this.id
    }
}
