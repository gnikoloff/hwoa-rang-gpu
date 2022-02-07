import { WGLSL_SAMPLER_TYPE } from './interfaces'

export default class Sampler {
  private device: GPUDevice
  private sampler: GPUSampler

  public bindingType: GPUSamplerBindingType
  public name: string
  public wglslSamplerType: WGLSL_SAMPLER_TYPE

  static parseGLFilterMode(filterMode: GLenum): GPUAddressMode {
    // TODO
    return 'repeat'
  }

  static parseGLWrapMode(wrapMode: GLenum): GPUAddressMode {
    // TODO
    return 'repeat'
  }

  get(): GPUSampler {
    return this.sampler
  }

  constructor(
    device: GPUDevice,
    name: string,
    bindingType: GPUSamplerBindingType = 'filtering',
    wglslSamplerType: WGLSL_SAMPLER_TYPE = 'sampler',
    samplerOptions: GPUSamplerDescriptor = null,
  ) {
    this.device = device
    this.name = name
    this.bindingType = bindingType
    this.wglslSamplerType = wglslSamplerType

    this.sampler = device.createSampler(samplerOptions)
  }

  destroy(): void {
    // TODO
    // webgpu spec has nothing on GPUSampler being destroyed
  }
}
