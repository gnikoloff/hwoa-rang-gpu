import { VertexBufferInput } from '..'
import { ATTRIB_NAME_POSITION } from '../constants'

import BaseBuffer from './BaseBuffer'
import BufferAttribute from './BufferAttribute'

export default class VertexBuffer extends BaseBuffer {
  public bindPointIdx: number
  public typedArray?: Float32Array
  public stride: GPUSize64
  public attributes: Map<string, BufferAttribute> = new Map()

  private stepMode: GPUVertexStepMode = 'vertex'

  constructor(
    device: GPUDevice,
    {
      usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      stride = 4 * Float32Array.BYTES_PER_ELEMENT,
      stepMode = 'vertex',
      typedArray,
      byteLength,
      bindPointIdx,
      mappedAtCreation,
      debugLabel,
    }: VertexBufferInput,
  ) {
    super(device, {
      typedArray,
      byteLength,
      usage,
      mappedAtCreation,
      debugLabel,
    })
    this.bindPointIdx = bindPointIdx
    this.stride = stride
    this.stepMode = stepMode
  }

  get itemsCount(): number {
    // TODO - hacky
    const itemsPerVertex = 3
    return this.byteLength / Float32Array.BYTES_PER_ELEMENT / itemsPerVertex
  }

  getLayout(vertexIdx: number): GPUVertexBufferLayout {
    if (!this.attributes.size) {
      console.error('Vertex buffer has no associated attributes!')
    }
    return {
      arrayStride: this.stride,
      stepMode: this.stepMode,
      attributes: Array.from(this.attributes).map(([_, vertexBuffer], i) => ({
        offset: vertexBuffer.offset,
        format: vertexBuffer.format,
        shaderLocation: vertexIdx + i,
      })),
    }
  }

  addAttribute(
    key: string,
    offset: GPUSize64 = 0,
    size: GPUSize64 = 3 * Float32Array.BYTES_PER_ELEMENT,
    format: GPUVertexFormat = 'float32x4',
  ): this {
    const attribute = new BufferAttribute(offset, size, format)
    this.attributes.set(key, attribute)
    return this
  }

  bind(renderPass: GPURenderPassEncoder): this {
    renderPass.setVertexBuffer(this.bindPointIdx, this.buffer)
    return this
  }
}
