import { VertexBuffer } from '..'
import { ShaderIOVar } from '../types'
import Shader from './Shader'

export default class FragmentShader extends Shader {
  addShaderVars(
    vertexBuffers: VertexBuffer[],
    customShaderVarsInputs: { [key: string]: ShaderIOVar } = {},
    customShaderVarsOutputs: { [key: string]: ShaderIOVar } = {},
  ): this {
    let inputVariableIdx = 0
    let outputVariableIdx = 0
    let inputDefinitionSnippet = ''
    let outputDefinitionSnippet = ''
    vertexBuffers.forEach(({ attributes }) => {
      for (const [key, { format }] of attributes) {
        const variableShaderFormat = Shader.getVertexInputFormat(format)
        if (!variableShaderFormat) {
          console.error('shader vertex variable has no proper wglsl format')
        }
        inputDefinitionSnippet += `
          @location(${inputVariableIdx}) ${key}: ${variableShaderFormat};
        `
        inputVariableIdx++
      }
    })
    for (const [key, { format }] of Object.entries(customShaderVarsInputs)) {
      const variableShaderFormat = Shader.getVertexInputFormat(format)
      if (!variableShaderFormat) {
        console.error('shader vertex variable has no proper wglsl format')
      }
      inputDefinitionSnippet += `
        @location(${inputVariableIdx}) ${key}: ${variableShaderFormat};
      `
      inputVariableIdx++
    }
    for (const [key, { format }] of Object.entries(customShaderVarsOutputs)) {
      const variableShaderFormat = Shader.getVertexInputFormat(format)
      if (!variableShaderFormat) {
        console.error('shader vertex variable has no proper wglsl format')
      }
      outputDefinitionSnippet += `
        @location(${outputVariableIdx + 1}) ${key}: ${variableShaderFormat};
      `
      outputVariableIdx++
    }
    this.source += `
      struct Input {
        @builtin(position) coords: vec4<f32>;
        ${inputDefinitionSnippet}
      };

      struct Output {
        @location(0) Color: vec4<f32>;
        ${outputDefinitionSnippet}
      };
    `
    return this
  }

  addMainFnSnippet(shaderSnippet: string): this {
    this.source += `
      @stage(fragment) fn main (input: Input) -> Output {
        var output: Output;
        ${shaderSnippet}
        return output;
      }
    `
    return this
  }
}
