import UniformBuffer from './buffers/UniformBuffer'
import StorageBuffer from './buffers/StorageBuffer'
import Sampler from './Sampler'
import Texture from './Texture'

export default class BindGroup {
  private device: GPUDevice
  private bindGroup!: GPUBindGroup
  private debugLabel?: string

  bindingIndex: number
  samplers: Sampler[] = []
  textures: Texture[] = []
  ubos: UniformBuffer[] = []
  storageBuffers: StorageBuffer[] = []

  constructor(device: GPUDevice, bindingIndex = 0, debugLabel?: string) {
    this.device = device
    this.bindingIndex = bindingIndex
    this.debugLabel = debugLabel
  }

  get() {
    return this.bindGroup
  }

  bind(renderPass: GPURenderPassEncoder | GPUComputePassEncoder): this {
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

  addStorage(storageBuffer: StorageBuffer): this {
    this.storageBuffers.push(storageBuffer)
    return this
  }

  addUBO(ubo: UniformBuffer): this {
    this.ubos.push(ubo)
    return this
  }

  getLayout() {
    const entries: GPUBindGroupLayoutEntry[] = []

    let accBindingIndex = 0

    this.ubos.forEach(() => {
      entries.push({
        visibility:
          GPUShaderStage.VERTEX |
          GPUShaderStage.FRAGMENT |
          GPUShaderStage.COMPUTE,
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

    this.storageBuffers.forEach(() => {
      entries.push({
        visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.COMPUTE,
        binding: accBindingIndex,
        buffer: {
          type: 'storage',
        },
      })
      accBindingIndex++
    })

    return this.device.createBindGroupLayout({
      entries,
      label: this.debugLabel,
    })
  }

  init(): this {
    const entries: GPUBindGroupEntry[] = []

    let accBindingIndex = 0

    this.ubos.forEach((bufferBlock) => {
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

    this.storageBuffers.forEach((storageBuffer, i) => {
      entries.push({
        binding: accBindingIndex,
        resource: {
          buffer: storageBuffer.get(),
          offset: 0,
          size: storageBuffer.byteLength,
        },
      })
      accBindingIndex++
    })

    this.bindGroup = this.device.createBindGroup({
      layout: this.getLayout(),
      entries,
      label: this.debugLabel,
    })
    return this
  }

  destroy(): void {
    this.ubos.forEach((ubo) => ubo.destroy())
    this.textures.forEach((texture) => texture.destroy())
    this.samplers.forEach((sampler) => sampler.destroy())
    this.storageBuffers.forEach((storageBuffer) => storageBuffer.destroy())
    // TODO
    // webgpu spec has nothing on destroying GPUBindGroup
  }
}
