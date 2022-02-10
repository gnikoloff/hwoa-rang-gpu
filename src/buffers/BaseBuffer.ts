import { BufferInput, TYPED_ARRAY } from '..'

export default class BaseBuffer {
  protected device: GPUDevice
  protected buffer: GPUBuffer
  protected typedArray?: TYPED_ARRAY

  public byteLength: number
  public usage: GPUBufferUsageFlags

  constructor(
    device: GPUDevice,
    {
      typedArray,
      byteLength,
      usage,
      mappedAtCreation = false,
      label,
    }: BufferInput,
  ) {
    this.device = device
    this.usage = usage

    if (typedArray) {
      this.typedArray = typedArray
      this.byteLength = typedArray.byteLength
      this.buffer = device.createBuffer({
        size: typedArray.byteLength,
        usage,
        mappedAtCreation: true,
        label,
      })
      if (typedArray instanceof Float32Array) {
        new Float32Array(this.buffer.getMappedRange()).set(typedArray)
      } else if (typedArray instanceof Int32Array) {
        new Int32Array(this.buffer.getMappedRange()).set(typedArray)
      } else if (typedArray instanceof Uint32Array) {
        new Uint32Array(this.buffer.getMappedRange()).set(typedArray)
      } else if (typedArray instanceof Int16Array) {
        new Int16Array(this.buffer.getMappedRange()).set(typedArray)
      } else if (typedArray instanceof Uint16Array) {
        new Uint16Array(this.buffer.getMappedRange()).set(typedArray)
      } else if (typedArray instanceof Int8Array) {
        new Int8Array(this.buffer.getMappedRange()).set(typedArray)
      } else if (typedArray instanceof Uint8Array) {
        new Uint8Array(this.buffer.getMappedRange()).set(typedArray)
      } else {
        throw new Error('unsupported typed array type')
      }
      this.buffer.unmap()
    } else {
      this.byteLength = byteLength
      this.buffer = device.createBuffer({
        size: byteLength,
        usage,
        mappedAtCreation,
        label,
      })
    }
  }

  get(): GPUBuffer {
    return this.buffer
  }

  getMappedRange(): ArrayBuffer {
    return this.buffer.getMappedRange()
  }

  unmap(): void {
    this.buffer.unmap()
  }

  write(byteOffset: GPUSize64, data: SharedArrayBuffer | ArrayBuffer): this {
    this.device.queue.writeBuffer(this.buffer, byteOffset, data)
    return this
  }

  destroy(): void {
    this.buffer.destroy()
  }
}
