import { WGLSL_TEXTURE_TYPE } from './interfaces'

export default class Texture {
  private device: GPUDevice
  private texture: GPUTexture

  public name: string
  public sampleType: GPUTextureSampleType
  public viewDimension: GPUTextureViewDimension
  public wglslTextureType: WGLSL_TEXTURE_TYPE

  constructor(
    device: GPUDevice,
    name: string,
    sampleType: GPUTextureSampleType = 'float',
    viewDimension: GPUTextureViewDimension = '2d',
    wglslTextureType: WGLSL_TEXTURE_TYPE = 'texture_2d<f32>',
  ) {
    this.device = device
    this.name = name
    this.sampleType = sampleType
    this.viewDimension = viewDimension
    this.wglslTextureType = wglslTextureType
  }

  get(): GPUTexture {
    return this.texture
  }

  fromImageBitmap(
    imageBitmap: ImageBitmap,
    format: GPUTextureFormat = 'rgba8unorm',
    usage = GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  ): this {
    this.texture = this.device.createTexture({
      size: [imageBitmap.width, imageBitmap.height, 1],
      format,
      usage,
    })
    this.device.queue.copyExternalImageToTexture(
      { source: imageBitmap },
      { texture: this.texture },
      [imageBitmap.width, imageBitmap.height],
    )
    return this
  }

  fromDefinition(descriptor: GPUTextureDescriptor): this {
    this.texture = this.device.createTexture(descriptor)
    return this
  }

  copyFromTexture(
    commandEncoder: GPUCommandEncoder,
    source: GPUImageCopyTexture,
    copySize: GPUExtent3DStrict,
  ): this {
    commandEncoder.copyTextureToTexture(
      source,
      {
        texture: this.texture,
      },
      copySize,
    )
    return this
  }

  destroy(): void {
    this.texture.destroy()
  }
}
