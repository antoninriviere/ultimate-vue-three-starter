import {
    Object3D,
    Vector3,
    Mesh
} from 'three'
import { randomInRange, randomIntInRange } from 'Utils/Numbers'

export default class Panties extends Object3D
{
    constructor(geo, mat, index, start)
    {
        super()

        this.vx = -randomIntInRange(5, 10)
        this.vy = -randomIntInRange(5, 10)

        this.SPRING = 0.01
        this.SPRING_LENGTH = 50
        this.FRICTION = randomInRange(0.75, 0.95)
        this.GRAVITY = randomInRange(0.05, 0.5)
        this.PI_ANGLE = randomIntInRange(2, 4)
        this.AMP = randomIntInRange(15, 30)
        this.sign = index % 2 === 0 ? 1 : -1
        this.t = 0
        this.active = false

        this.initPos = new Vector3(
            start,
            350,
            start * this.sign * 2
        )
        this.mesh = new Mesh(geo, mat)
        this.mesh.position.set(this.initPos.x, randomIntInRange(-250, 250), this.initPos.z)
        const delay = 200 * index
        setTimeout(() =>
        {
            this.add(this.mesh)
            this.active = true
        }, delay)
    }
    animate(delta)
    {
        if(!this.active)
            return
        this.t += delta * 0.0001
        const newX = this.mesh.position.x + this.AMP * Math.exp(-this.t) * Math.sin(Math.PI * this.PI_ANGLE * this.t) * this.sign
        const newY = this.mesh.position.y + 10
        const dx = this.mesh.position.x - newX
        const dy = this.mesh.position.y - newY
        const angle = Math.atan2(dy, dx)
        const targetX = newX + Math.cos(angle) * this.SPRING_LENGTH
        const targetY = newY + Math.sin(angle) * this.SPRING_LENGTH
        const ax = (targetX - this.mesh.position.x) * this.SPRING
        const ay = (targetY - this.mesh.position.y) * this.SPRING
        this.vx += ax
        this.vy += ay
        this.vx *= this.FRICTION
        this.vy *= this.FRICTION
        this.mesh.position.x += this.vx
        this.mesh.position.y += this.vy
        this.mesh.position.z += this.vx
        this.mesh.rotation.x += 0.005
        this.mesh.rotation.y += 0.005
        this.mesh.rotation.z += 0.005
        if(this.mesh.position.y < -350)
        {
            this.mesh.position.set(this.initPos.x, this.initPos.y, this.initPos.z)
            this.mesh.rotation.set(0, 0, 0)
            this.vx = randomIntInRange(15, 30)
            this.vy = randomIntInRange(15, 30)
            this.t = 0
        }
    }
}
