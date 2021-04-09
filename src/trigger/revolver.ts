import { Bullet } from './bullet'
import { CronExpression } from './cron-expression'

export class Revolver {

    private _clip?: Bullet | null

    fill(crontab: CronExpression, handler: Function) {
        const bullet = new Bullet(crontab, handler, crontab.next(), null)
        if (!this._clip) {
            this._clip = bullet
        } else if (this._clip.execution.isAfter(bullet.execution)) {
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
        } else if (bullet.execution.isAfter(clip.execution)) {
            this.insert(clip.next_bullet, bullet)
        } else {
            bullet.next_bullet = clip.next_bullet
            clip.next_bullet = bullet
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
