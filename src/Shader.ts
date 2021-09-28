import { VertexBuffer } from '.'
import { UniformInputs, VaryingsInputs } from './types'

export class Shader {
  private device: GPUDevice
  stage: GPUShaderStageFlags
  module!: GPUShaderModule
  source: string = ``

  static ENTRY_FUNCTION = 'main'

  private static TRANSFORM_UBO_SNIPPET = `
    [[block]] struct Transform {
      projectionMatrix: mat4x4<f32>;
      viewMatrix: mat4x4<f32>;
      modelMatrix: mat4x4<f32>;
      normalMatrix: mat4x4<f32>;
    };

    [[group(0), binding(0)]] var<uniform> transform: Transform;
  `

  // TODO add all cases in a Map
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

  constructor(device: GPUDevice, stage: GPUShaderStageFlags) {
    this.device = device
    this.stage = stage

    if (stage === GPUShaderStage.VERTEX) {
      this.source += `${Shader.TRANSFORM_UBO_SNIPPET}`
    }
  }

  addUniformInputs(uniforms: UniformInputs): this {
    this.source += `
      [[block]] struct UniformsInput {
        ${Object.entries(uniforms).reduce((acc, [key, { type }]) => {
          acc += `${key}: ${type};`
          return acc
        }, '')}
      };

      [[group(0), binding(1)]] var<uniform> inputUBO: UniformsInput;
    `
    return this
  }

  addVertexInputs(
    vertexBuffers: VertexBuffer[],
    customVaryings: VaryingsInputs = {},
  ): this {
    let varyingDefinitions: string = vertexBuffers.reduce(
      (acc, { attributes, bindPointIdx }) => {
        for (const [key, attrib] of attributes.entries()) {
          const inputFormat = Shader.getVertexInputFormat(attrib.format)
          let offsetBindPointIdx = bindPointIdx
          acc += `[[location(${offsetBindPointIdx})]] ${key}: ${inputFormat};\n`
        }
        return acc
      },
      '',
    )

    const totalBindIndices =
      vertexBuffers[vertexBuffers.length - 1].bindPointIdx

    varyingDefinitions += Object.entries(customVaryings).reduce(
      (acc, [key, { type }], i) => {
        const inputFormat = Shader.getVertexInputFormat(type)
        const offsetBindPointIdx = totalBindIndices + i + 1
        acc += `[[location(${offsetBindPointIdx})]] ${key}: ${inputFormat};\n`
        return acc
      },
      '',
    )

    if (this.stage === GPUShaderStage.VERTEX) {
      this.source += `
        struct Input {
          ${vertexBuffers.reduce((acc, { attributes, bindPointIdx }) => {
            for (const [key, attrib] of attributes.entries()) {
              const inputFormat = Shader.getVertexInputFormat(attrib.format)
              acc += `[[location(${bindPointIdx})]] ${key}: ${inputFormat};\n`
            }

            return acc
          }, '')}
        };

        struct Output {
          [[builtin(position)]] Position: vec4<f32>;
          ${varyingDefinitions}
        };
      `
    } else if (this.stage === GPUShaderStage.FRAGMENT) {
      this.source += `
        struct Input {
          ${varyingDefinitions}
        };
      `
    }
    return this
  }

  addTextureInputs(
    textureBindPoints: { bindIdx: number; name: string; type: string }[],
  ) {
    this.source += textureBindPoints.reduce(
      (acc, { bindIdx, name, type }) =>
        acc +
        `
          [[group(0), binding(${bindIdx})]] var ${name}: ${type};
        `,
      '',
    )
  }

  addSamplerInputs(
    samplerBindPoints: { bindIdx: number; name: string; type: string }[],
  ): this {
    this.source += samplerBindPoints.reduce(
      (acc, { bindIdx, name, type }) =>
        acc +
        `
          [[group(0), binding(${bindIdx})]] var ${name}: ${type};
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
    } else if (this.stage === GPUShaderStage.FRAGMENT) {
      this.source += `
          [[stage(fragment)]] fn main (input: Input) -> [[location(0)]] vec4<f32> {
            ${shaderSnippet}
          }
        `
    }
    return this
  }
}
