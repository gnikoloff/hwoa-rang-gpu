import { IndexBuffer } from './buffers/IndexBuffer'
import { VertexBuffer } from './buffers/VertexBuffer'

import {
  ATTRIB_NAME_POSITION,
  PRIMITIVE_TOPOLOGY_LINE_STRIP,
  PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
  PRIMITIVE_TOPOLOGY_TRIANGLE_STRIP,
} from './constants'

export class Geometry {
  private device: GPUDevice
  private indexBuffer?: IndexBuffer
  private vertexCount = 0

  public instanceCount = 1
  public vertexBuffers: VertexBuffer[] = []
  public primitiveType: GPUPrimitiveTopology = PRIMITIVE_TOPOLOGY_TRIANGLE_LIST

  constructor(device: GPUDevice) {
    this.device = device
  }

  get hasIndex(): boolean {
    return !!this.indexBuffer
  }

  get stripIndexFormat(): GPUIndexFormat | undefined {
    let stripIndexFormat: GPUIndexFormat | undefined = undefined
    if (
      this.primitiveType === PRIMITIVE_TOPOLOGY_LINE_STRIP ||
      this.primitiveType === PRIMITIVE_TOPOLOGY_TRIANGLE_STRIP
    ) {
      stripIndexFormat = this.indexBuffer?.isInt16 ? 'uint16' : 'uint32'
    }
    return stripIndexFormat
  }

  addIndexBuffer(indexBuffer: IndexBuffer): this {
    this.vertexCount = indexBuffer.itemsCount
    this.indexBuffer = indexBuffer
    return this
  }

  addVertexBuffer(vertexBuffer: VertexBuffer): this {
    const holdsPosition = vertexBuffer.attributes.get(ATTRIB_NAME_POSITION)
    if (holdsPosition && !this.vertexCount) {
      this.vertexCount = vertexBuffer.itemsCount
    }
    this.vertexBuffers.push(vertexBuffer)
    return this
  }

  getVertexBuffersLayout(): GPUVertexBufferLayout[] {
    const buffers: GPUVertexBufferLayout[] = []
    let vertexBindIdx = 0
    for (const vertexBuffer of this.vertexBuffers.values()) {
      buffers.push(vertexBuffer.getLayout(vertexBindIdx))
      vertexBindIdx += vertexBuffer.attributes.size
    }
    return buffers
  }

  draw(renderPass: GPURenderPassEncoder): void {
    this.vertexBuffers.forEach((vertexBuffer) => vertexBuffer.bind(renderPass))

    if (this.indexBuffer) {
      this.indexBuffer.bind(renderPass)
      renderPass.drawIndexed(this.vertexCount, this.instanceCount)
    } else {
      renderPass.draw(this.vertexCount, this.instanceCount)
    }
  }

  destroy(): void {
    this.indexBuffer?.destroy()
    this.vertexBuffers.forEach((buffer) => buffer.destroy())
  }
}
