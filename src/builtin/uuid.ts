import uuid from 'uuid'
import { Component } from '../tora-component'

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
