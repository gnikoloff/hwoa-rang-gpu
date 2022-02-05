export class BaseBuffer {
  protected device: GPUDevice
  protected buffer: GPUBuffer

  constructor(device: GPUDevice) {
    this.device = device
  }

  get(): GPUBuffer {
    return this.buffer
  }

  write(byteOffset: GPUSize64, data: SharedArrayBuffer | ArrayBuffer): this {
    this.device.queue.writeBuffer(this.buffer, byteOffset, data)
    return this
  }

  destroy(): void {
    this.buffer.destroy()
  }
}
