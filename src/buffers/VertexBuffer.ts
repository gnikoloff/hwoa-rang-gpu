import { BaseBuffer } from './BaseBuffer'
import { BufferAttribute } from './BufferAttribute'

export class VertexBuffer extends BaseBuffer {
  public bindPointIdx: number
  public typedArray: Float32Array
  public arrayStride: GPUSize64
  public attributes: Map<string, BufferAttribute> = new Map()

  private stepMode: GPUVertexStepMode = 'vertex'

  constructor(
    device: GPUDevice,
    bindPointIdx: number,
    typedArray: Float32Array,
    arrayStride: GPUSize64 = 4 * Float32Array.BYTES_PER_ELEMENT,
    usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    stepMode: GPUVertexStepMode = 'vertex',
  ) {
    super(device)
    this.bindPointIdx = bindPointIdx
    this.typedArray = typedArray
    this.arrayStride = arrayStride
    this.stepMode = stepMode

    this.buffer = device.createBuffer({
      size: typedArray.byteLength,
      usage,
      mappedAtCreation: true,
    })
    new Float32Array(this.buffer.getMappedRange()).set(typedArray)
    this.buffer.unmap()
  }

  get itemsCount(): number {
    return this.typedArray.length / this.arrayStride
  }

  getLayout(vertexIdx: number): GPUVertexBufferLayout {
    if (!this.attributes.size) {
      console.error('Vertex buffer has no associated attributes!')
    }
    return {
      arrayStride: this.arrayStride,
      stepMode: this.stepMode,
      attributes: Array.from(this.attributes).map(([_, vertexBuffer], i) => {
        return {
          offset: vertexBuffer.offset,
          format: vertexBuffer.format,
          shaderLocation: vertexIdx + i,
        }
      }),
    }
  }

  addAttribute(
    key: string,
    offset: GPUSize64 = 0,
    size: GPUSize64 = 3,
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
