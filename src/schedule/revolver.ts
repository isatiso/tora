/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TaskDescriptor } from '../types'
import { Bullet } from './bullet'
import { Schedule } from './schedule'

export class Revolver {

    private _clip?: Bullet | null

    fill(crontab: Schedule, handler: Function, desc: TaskDescriptor) {
        const bullet = new Bullet(crontab, handler, crontab.next(), null, desc)
        if (!this._clip) {
            this._clip = bullet
        } else if (bullet.execution.isBefore(this._clip.execution)) {
            bullet.next_bullet = this._clip
            this._clip = bullet
        } else {
            this.insert(this._clip, bullet)
        }
    }

    shoot(timestamp: number) {
        if (!this._clip) {
            return
        }
        while (this._clip.execution.valueOf() <= timestamp) {
            this.execute()
        }
    }

    get_task_list() {
        const list: {
            name: string
            pos: string
            crontab: string
            next_execution: string
        }[] = []

        let bullet = this._clip
        while (bullet) {
            list.push({
                name: bullet.desc.name ?? bullet.desc.pos ?? '',
                pos: bullet.desc.pos ?? '',
                crontab: bullet.desc.crontab ?? '',
                next_execution: bullet.execution.format('YYYY-MM-DD HH:mm:ss'),
            })
            bullet = bullet.next_bullet
        }
        return list
    }

    private execute() {
        if (!this._clip) {
            return
        }
        const execution = this._clip.execution
        this._clip.execution = this._clip.crontab.next()
        const clip = this._clip
        this._clip.handler(execution).catch((err: any) => {
            console.log('on error', err)
            if (!this._clip) {
                return
            } else if (this._clip === clip) {
                this._clip = clip.next_bullet
            } else {
                this.remove(this._clip, clip)
            }
        })
        if (this._clip.next_bullet && this._clip.next_bullet.execution.isBefore(this._clip.execution)) {
            const bullet = this._clip
            this._clip = bullet.next_bullet!
            bullet.next_bullet = null
            this.insert(this._clip, bullet)
        }
    }

    private insert(clip: Bullet, bullet: Bullet) {
        if (!clip.next_bullet) {
            clip.next_bullet = bullet
        } else if (bullet.execution.isBefore(clip.next_bullet.execution)) {
            bullet.next_bullet = clip.next_bullet
            clip.next_bullet = bullet
        } else {
            this.insert(clip.next_bullet, bullet)
        }
    }

    private remove(clip: Bullet, bullet: Bullet) {
        if (!clip.next_bullet) {
            return
        } else if (clip.next_bullet === bullet) {
            clip.next_bullet = bullet.next_bullet
            return
        } else {
            this.remove(clip.next_bullet, bullet)
        }
    }
}
