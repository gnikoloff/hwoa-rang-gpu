import { WGLSL_INPUT_TYPE, UniformInputs } from '../interfaces'

const VERTEX_WGLSL_TYPES = new Map([
  ['float32', 'f32'],
  ['float32x2', 'vec2<f32>'],
  ['float32x3', 'vec4<f32>'], // Exception: want to "autofill" vertex geometry inputs as vec4s, webgl style
  ['float32x4', 'vec4<f32>'],
  ['sint32', 'i32'],
  ['sint32x2', 'vec2<i32>'],
  ['sint32x3', 'vec3<i32>'],
  ['sint32x4', 'vec4<f32>'],
  ['uint32', 'u32'],
  ['uint32x2', 'vec2<u32>'],
  ['uint32x3', 'vec3<u32>'],
  ['uint32x4', 'vec4<u32>'],
])

export default class Shader {
  protected device: GPUDevice
  public module!: GPUShaderModule
  public source: string = ``

  static ENTRY_FUNCTION = 'main'

  static getVertexInputFormat(format: GPUVertexFormat) {
    let wglslFormat = VERTEX_WGLSL_TYPES.get(format)
    if (!wglslFormat) {
      throw new Error(`Can't get input WGLSL type for vertex input`)
    }
    return wglslFormat
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
