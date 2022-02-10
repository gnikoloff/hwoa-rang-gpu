import { IndexBufferInput } from '..'
import BaseBuffer from './BaseBuffer'

export default class IndexBuffer extends BaseBuffer {
  get isInt16() {
    return this.typedArray instanceof Uint16Array
  }

  get itemsCount() {
    return this.typedArray.length
  }

  constructor(
    device: GPUDevice,
    {
      usage = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      typedArray,
      byteLength,
      mappedAtCreation,
      debugLabel,
    }: IndexBufferInput,
  ) {
    super(device, {
      typedArray,
      byteLength,
      usage,
      mappedAtCreation,
      debugLabel,
    })
  }

  bind(renderPass: GPURenderPassEncoder): this {
    renderPass.setIndexBuffer(this.buffer, this.isInt16 ? 'uint16' : 'uint32')
    return this
  }
}
