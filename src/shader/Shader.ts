import { WGLSL_INPUT_TYPE, UniformInputs } from '../types'

export default class Shader {
  protected device: GPUDevice
  public module!: GPUShaderModule
  public source: string = ``

  static ENTRY_FUNCTION = 'main'

  static getVertexInputFormat(format: GPUVertexFormat) {
    switch (format) {
      case 'float32':
        return 'f32'
      case 'float32x2':
        return 'vec2<f32>'
      case 'float32x3':
        return 'vec4<f32>'
      case 'float32x4':
        return 'vec4<f32>'
    }
  }

  get shaderModule(): GPUShaderModule {
    if (!this.module) {
      this.module = this.device.createShaderModule({
        code: this.source,
      })
    }
    return this.module
  }

  constructor(device: GPUDevice) {
    this.device = device
  }

  addUniformInputs(uniforms: UniformInputs, bindIdx: number = 1): this {
    this.source += `
      struct UniformsInput {
        ${Object.entries(uniforms).reduce((acc, [key, { type }]) => {
          acc += `${key}: ${type};`
          return acc
        }, '')}
      };

      @group(0) @binding(${bindIdx}) var<uniform> inputUBO: UniformsInput;
    `
    return this
  }

  addTextureInputs(
    textureBindPoints: { bindIdx: number; name: string; type: string }[],
  ): this {
    this.source += textureBindPoints.reduce(
      (acc, { bindIdx, name, type }) =>
        acc +
        `
          @group(0) @binding(${bindIdx}) var ${name}: ${type};
        `,
      '',
    )
    return this
  }

  addSamplerInputs(
    samplerBindPoints: { bindIdx: number; name: string; type: string }[],
  ): this {
    this.source += samplerBindPoints.reduce(
      (acc, { bindIdx, name, type }) =>
        acc +
        `
          @group(0) @binding(${bindIdx}) var ${name}: ${type};
          `,
      '',
    )
    return this
  }

  addStorages(
    storageBindPoints: {
      bindIdx: number
      name: string
      attributes: { [key: string]: WGLSL_INPUT_TYPE }
      dataStride: number
    }[],
  ): this {
    storageBindPoints.forEach(({ dataStride, bindIdx, name, attributes }) => {
      this.source += `
        struct ${name} {
          ${Object.entries(attributes)
            .map(([key, format]) => `${key}: ${format};`)
            .join('\n')}
        };

        struct ${name}Collection {
          ${name.toLowerCase()}s: @stride(48) array<Light>;
        };

        @group(0) @binding(${bindIdx}) var<storage, read_write> ${name.toLowerCase()}Collection: ${name}Collection;
      `
    })
    return this
  }

  addHeadSnippet(shaderSnippet: string): this {
    if (shaderSnippet) {
      this.source += shaderSnippet
    }
    return this
  }
}
