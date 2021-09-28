import { Buffer } from './Buffer'

export class UniformBuffer extends Buffer {
  public byteLength: number

  constructor(
    device: GPUDevice,
    byteLength: GPUSize64,
    usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  ) {
    super()
    this.device = device
    this.byteLength = byteLength

    this.buffer = device.createBuffer({
      size: byteLength,
      usage,
    })
  }

  write(byteOffset: GPUSize64, data: SharedArrayBuffer | ArrayBuffer) {
    this.device.queue.writeBuffer(this.buffer, byteOffset, data)
  }
}
