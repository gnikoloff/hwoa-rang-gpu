import BaseBuffer from './BaseBuffer'

export default class UniformBuffer extends BaseBuffer {
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
}
