export class Buffer {
  protected device: GPUDevice
  protected buffer: GPUBuffer

  get(): GPUBuffer {
    return this.buffer
  }

  destroy(): void {
    this.buffer.destroy()
  }
}
