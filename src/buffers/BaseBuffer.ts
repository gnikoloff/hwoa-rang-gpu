export class BaseBuffer {
  protected device: GPUDevice
  protected buffer: GPUBuffer

  constructor(device: GPUDevice) {
    this.device = device
  }

  get(): GPUBuffer {
    return this.buffer
  }

  destroy(): void {
    this.buffer.destroy()
  }
}
