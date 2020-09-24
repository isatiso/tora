import { Component } from '../tora-component'

/**
 * @author plankroot
 * @class Generate a unix-timestamp in milliseconds.
 *
 * @example
 * class TestRouter {
 *
 *     @Post()
 *     async test(
 *         now: CurrentTimestamp
 *     ) {
 *
 *         return {
 *             timestamp: now
 *         }
 *     }
 * }
 */
@Component()
export class CurrentTimestamp extends Number {

    private _timestamp = new Date().getTime()

    valueOf() {
        return this._timestamp
    }
}
