import { StorageBufferInput } from '..'
import { WGLSL_BUFFER_ACCESS_MODE_TYPE, WGLSL_INPUT_TYPE } from '../interfaces'
import BaseBuffer from './BaseBuffer'

export default class StorageBuffer extends BaseBuffer {
  public stride: number
  public usage: GPUBufferUsageFlags

  public name: string
  public structDefinition: { [key: string]: WGLSL_INPUT_TYPE }

  constructor(
    device: GPUDevice,
    {
      usage = GPUBufferUsage.STORAGE,
      stride,
      typedArray,
      byteLength,
      mappedAtCreation,
      label,
    }: StorageBufferInput,
  ) {
    super(device, {
      typedArray,
      byteLength,
      usage,
      mappedAtCreation,
      label,
    })
    this.stride = stride
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
