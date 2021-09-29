import { Buffer } from './Buffer'

export class IndexBuffer extends Buffer {
  public itemsCount: number
  public typedArray: Uint16Array | Uint32Array

  get isInt16() {
    return this.typedArray instanceof Uint16Array
  }

  constructor(device: GPUDevice, typedArray: Uint16Array | Uint32Array) {
    super()
    this.device = device
    this.itemsCount = typedArray.length
    this.typedArray = typedArray

    this.buffer = device.createBuffer({
      size: Math.ceil(typedArray.byteLength / 8) * 8,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    })

    if (this.isInt16) {
      new Uint16Array(this.buffer.getMappedRange()).set(typedArray)
    } else {
      new Uint32Array(this.buffer.getMappedRange()).set(typedArray)
    }

    this.buffer.unmap()
  }

  bind(renderPass: GPURenderPassEncoder): this {
    renderPass.setIndexBuffer(this.buffer, this.isInt16 ? 'uint16' : 'uint32')
    return this
  }

}