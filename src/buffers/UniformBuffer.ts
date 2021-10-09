import { BaseBuffer } from './BaseBuffer'

export class UniformBuffer extends BaseBuffer {
  public byteLength: number

  constructor(
    device: GPUDevice,
    byteLength: GPUSize64,
    usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  ) {
    super(device)
    this.byteLength = byteLength

    this.buffer = device.createBuffer({
      size: byteLength,
      usage,
    })
  }

  write(byteOffset: GPUSize64, data: SharedArrayBuffer | ArrayBuffer): this {
    this.device.queue.writeBuffer(this.buffer, byteOffset, data)
    return this
  }
}
