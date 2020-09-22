import { Component } from '../tora-component'

@Component()
export class CurrentTimestamp extends Number {

    private _timestamp = new Date().getTime()

    valueOf() {
        return this._timestamp
    }
}
