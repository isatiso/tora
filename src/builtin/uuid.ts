import uuid from 'uuid'
import { Component } from '../tora-component'

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

    private _id = uuid.v1().replace(/-/g, '')

    valueOf() {
        return this._id
    }

    toString() {
        return this._id
    }
}
