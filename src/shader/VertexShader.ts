import { VertexBuffer } from '..'
import { ShaderIOVar } from '../interfaces'
import Shader from './Shader'

export default class VertexShader extends Shader {
  protected static TRANSFORM_UBO_SNIPPET = `
    struct Transform {
      projectionMatrix: mat4x4<f32>;
      viewMatrix: mat4x4<f32>;
      modelMatrix: mat4x4<f32>;
      normalMatrix: mat4x4<f32>;
    };

    @group(0) @binding(0) var<uniform> transform: Transform;
  `

  constructor(device: GPUDevice) {
    super(device)
    this.source += VertexShader.TRANSFORM_UBO_SNIPPET
  }

  addShaderVars(
    vertexBuffers: VertexBuffer[],
    customShaderVarsOutputs: { [key: string]: ShaderIOVar } = {},
  ): this {
    let variableIdx = 0
    let inputDefinitionSnippet = ''
    let outputDefinitionSnippet = ''
    console.log(vertexBuffers)
    vertexBuffers.forEach(({ attributes }) => {
      for (const [key, { format }] of attributes) {
        const variableShaderFormat = Shader.getVertexInputFormat(format)
        if (!variableShaderFormat) {
          console.error('shader vertex variable has no proper wglsl format')
        }
        inputDefinitionSnippet += `
          @location(${variableIdx}) ${key}: ${variableShaderFormat};
        `
        outputDefinitionSnippet += `
          @location(${variableIdx}) ${key}: ${variableShaderFormat};
        `
        variableIdx++
      }
    })
    for (const [key, { format }] of Object.entries(customShaderVarsOutputs)) {
      const variableShaderFormat = Shader.getVertexInputFormat(format)
      if (!variableShaderFormat) {
        console.error('shader vertex variable has no proper wglsl format')
      }
      outputDefinitionSnippet += `
        @location(${variableIdx}) ${key}: ${variableShaderFormat};
      `
      variableIdx++
    }
    this.source += `
      struct Input {
        ${inputDefinitionSnippet}
      };

      struct Output {
        @builtin(position) Position: vec4<f32>;
        ${outputDefinitionSnippet}
      };
    `
    return this
  }

  addMainFnSnippet(shaderSnippet: string): this {
    this.source += `
      @stage(vertex) fn main (input: Input) -> Output {
        var output: Output;
        ${shaderSnippet}
        return output;
      }
    `
    return this
  }
}
