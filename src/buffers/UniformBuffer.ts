import { BufferInput, UniformBufferInput } from '..'
import BaseBuffer from './BaseBuffer'

export default class UniformBuffer extends BaseBuffer {
  constructor(
    device: GPUDevice,
    {
      usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      byteLength,
      typedArray,
      mappedAtCreation,
      label,
    }: BufferInput,
  ) {
    super(device, { byteLength, typedArray, usage, mappedAtCreation, label })
  }
}
