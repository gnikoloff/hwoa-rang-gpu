import { ATTRIB_NAME_POSITION } from './constants'
import { Uniform } from './Mesh'

const TRANSFORM_UBO_SNIPPET = `
  [[block]] struct Transform {
    projectionMatrix: mat4x4<f32>;
    viewMatrix: mat4x4<f32>;
    modelMatrix: mat4x4<f32>;
    normalMatrix: mat4x4<f32>;
  };

  [[group(0), binding(0)]] var<uniform> transform: Transform;
`

export class Shader {
  private device: GPUDevice
  stage: GPUShaderStageFlags
  module!: GPUShaderModule
  source: string = ``

  static ENTRY_FUNCTION = 'main'

  static getVertexInputFormat(format: GPUVertexFormat) {
    switch (format) {
      case 'float32':
        return '<f32>'
      case 'float32x2':
        return 'vec4<f32>'
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

  constructor(device: GPUDevice, stage: GPUShaderStageFlags) {
    this.device = device
    this.stage = stage

    if (stage === GPUShaderStage.VERTEX) {
      this.source += `${TRANSFORM_UBO_SNIPPET}`
    }
  }

  addUniformInputs(inputDefinitions: [string, Uniform][]): this {
    this.source += `
      [[block]] struct UniformsInput {
        ${inputDefinitions.reduce((acc, [key, { type }]) => {
          acc += `${key}: ${type};`
          return acc
        }, '')}
      };

      [[group(0), binding(1)]] var<uniform> inputUBO: UniformsInput;
    `
    return this
  }

  addVertexInputs(inputDefinitions): this {
    const varyingDefinitions = inputDefinitions
      // .filter(([key]) => key !== ATTRIB_NAME_POSITION)
      .reduce((acc, [key, { bindPointIdx, format }]) => {
        const inputFormat = Shader.getVertexInputFormat(format)
        let offsetBindPointIdx = bindPointIdx
        acc += `[[location(${offsetBindPointIdx})]] ${key}: ${inputFormat};\n`
        return acc
      }, '')

    if (this.stage === GPUShaderStage.VERTEX) {
      this.source += `
        struct Input {
          ${inputDefinitions.reduce((acc, [key, { bindPointIdx, format }]) => {
            const inputFormat = Shader.getVertexInputFormat(format)
            acc += `[[location(${bindPointIdx})]] ${key}: ${inputFormat};\n`
            return acc
          }, '')}
        };

        struct Output {
          [[builtin(position)]] Position: vec4<f32>;
          ${varyingDefinitions}
        };
      `
    } else {
      this.source += `
        struct Input {
          ${varyingDefinitions}
        };
      `
    }
    return this
  }

  addTextureInputs(textureBindPoints: { bindIdx: number; name: string }[]) {
    this.source += textureBindPoints.reduce(
      (acc, { bindIdx, name }) =>
        acc +
        `
          [[group(0), binding(${bindIdx})]] var ${name}: texture_2d<f32>;
        `,
      '',
    )
  }

  addSamplerInputs(
    samplerBindPoints: { bindIdx: number; name: string }[],
  ): this {
    this.source += samplerBindPoints.reduce(
      (acc, { bindIdx, name }) =>
        acc +
        `
          [[group(0), binding(${bindIdx})]] var ${name}: sampler;
          `,
      '',
    )
    return this
  }

  addHeadSnippet(shaderSnippet: string): this {
    if (shaderSnippet) {
      this.source += shaderSnippet
    }
    return this
  }

  addMainFnSnippet(shaderSnippet: string): this {
    if (!shaderSnippet) {
      throw new Error('Shader must have a main fn block')
    }
    if (this.stage === GPUShaderStage.VERTEX) {
      this.source += `
        [[stage(vertex)]] fn main (input: Input) -> Output {
          var output: Output;
          ${shaderSnippet}
          return output;
        }
      `
    } else {
      this.source += `
        [[stage(fragment)]] fn main (input: Input) -> [[location(0)]] vec4<f32> {
          ${shaderSnippet}
        }
      `
    }
    return this
  }
}
