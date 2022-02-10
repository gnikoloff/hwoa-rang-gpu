import {
  alignUniformsToStd140Layout,
  Uniform,
  UniformBufferInput,
  UniformDefinition,
} from '..'
import BaseBuffer from './BaseBuffer'

export default class UniformBuffer extends BaseBuffer {
  device: GPUDevice

  name: string
  byteLength: number
  uniforms: {
    [key: string]: UniformDefinition
  }
  buffer: GPUBuffer

  constructor(
    device: GPUDevice,
    {
      name,
      uniforms,
      usage = GPUBufferUsage.COPY_DST | GPUBufferUsage.UNIFORM,
      debugLabel,
    }: UniformBufferInput,
  ) {
    const [byteLength, alignedUniforms] = alignUniformsToStd140Layout(uniforms)
    super(device, {
      byteLength,
      usage,
      debugLabel,
    })
    this.name = name
    this.uniforms = alignedUniforms
    for (const uniform of Object.values(alignedUniforms)) {
      if (!uniform.value) {
        continue
      }
      this.write(uniform.byteOffset, uniform.value)
    }
  }

  updateUniform(key: string, value: ArrayBuffer | SharedArrayBuffer): this {
    const uniform = this.uniforms[key]
    if (!uniform) {
      console.error(`can't find uniform!`)
      return this
    }
    uniform.value = value
    this.device.queue.writeBuffer(
      this.buffer,
      uniform.byteOffset,
      uniform.value,
    )
    return this
  }
}
