import { WGLSL_BUFFER_ACCESS_MODE_TYPE, WGLSL_INPUT_TYPE } from '../interfaces'
import BaseBuffer from './BaseBuffer'

export default class StorageBuffer extends BaseBuffer {
  public byteLength: number
  public dataStride: number
  public usage: GPUBufferUsageFlags

  public name: string
  public structDefinition: { [key: string]: WGLSL_INPUT_TYPE }

  constructor(
    device: GPUDevice,
    data: Float32Array,
    dataStride: number,
    usage = GPUBufferUsage.STORAGE,
  ) {
    super(device)
    this.byteLength = data.byteLength
    this.dataStride = dataStride
    this.usage = usage

    this.buffer = device.createBuffer({
      size: data.byteLength,
      usage,
      mappedAtCreation: true,
    })
    new Float32Array(this.buffer.getMappedRange()).set(data)
    this.buffer.unmap()
  }

  get wgslAccessMode(): WGLSL_BUFFER_ACCESS_MODE_TYPE {
    // TODO
    return '<storage, read_write>'
  }

  addAttribute(
    name: string,
    structDefinitions: { [key: string]: WGLSL_INPUT_TYPE },
  ): this {
    if (this.name) {
      console.error('storage buffer supports only one struct')
    }
    this.name = name
    this.structDefinition = structDefinitions
    return this
  }
}
