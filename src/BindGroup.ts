import { UniformBuffer } from './buffers/UniformBuffer'
import { Sampler } from './Sampler'
import { Texture } from './Texture'

export class BindGroup {
  private device: GPUDevice
  private bindGroup!: GPUBindGroup

  public bindingIndex: number
  public samplers: Sampler[] = []
  public textures: Texture[] = []
  public uniformBlocks: UniformBuffer[] = []

  constructor(device: GPUDevice, bindingIndex = 0) {
    this.device = device
    this.bindingIndex = bindingIndex
  }

  bind(renderPass: GPURenderPassEncoder): this {
    renderPass.setBindGroup(this.bindingIndex, this.bindGroup)
    return this
  }

  addSampler(sampler: Sampler): this {
    this.samplers.push(sampler)
    return this
  }

  addTexture(texture: Texture): this {
    this.textures.push(texture)
    return this
  }

  addUBO(byteLength): this {
    const uniformBlock = new UniformBuffer(this.device, byteLength)
    this.uniformBlocks.push(uniformBlock)
    return this
  }

  writeToUBO(
    uboIdx: number,
    byteOffset: number,
    data: SharedArrayBuffer | ArrayBuffer,
  ): this {
    const ubo = this.uniformBlocks[uboIdx]
    if (!ubo) {
      console.error('UBO not found')
      return this
    }
    ubo.write(byteOffset, data)
    return this
  }

  getLayout() {
    const entries: GPUBindGroupLayoutEntry[] = []

    let accBindingIndex = 0

    this.uniformBlocks.forEach(() => {
      entries.push({
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        binding: accBindingIndex,
        buffer: {
          type: 'uniform',
        },
      })
      accBindingIndex++
    })

    this.samplers.forEach((sampler) => {
      entries.push({
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        binding: accBindingIndex,
        sampler: {
          type: sampler.bindingType,
        },
      })
      accBindingIndex++
    })

    this.textures.forEach((texture) => {
      entries.push({
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        binding: accBindingIndex,
        texture: {
          sampleType: texture.sampleType,
        },
      })
      accBindingIndex++
    })

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries,
    })

    return bindGroupLayout
  }

  attachToPipeline(pipeline: GPURenderPipeline): this {
    const entries: GPUBindGroupEntry[] = []

    let accBindingIndex = 0

    this.uniformBlocks.forEach((bufferBlock) => {
      entries.push({
        binding: accBindingIndex,
        resource: {
          buffer: bufferBlock.get(),
          offset: 0,
          size: bufferBlock.byteLength,
        },
      })
      accBindingIndex++
    })

    this.samplers.forEach((sampler) => {
      entries.push({
        binding: accBindingIndex,
        resource: sampler.get(),
      })
      accBindingIndex++
    })

    this.textures.forEach((texture, i) => {
      entries.push({
        binding: accBindingIndex,
        resource: texture.get().createView(),
      })
      accBindingIndex++
    })

    this.bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(this.bindingIndex),
      entries,
    })
    return this
  }

  destroy(): void {
    this.uniformBlocks.forEach((ubo) => ubo.destroy())
  }
}