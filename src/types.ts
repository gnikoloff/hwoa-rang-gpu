import { Geometry, Sampler, Texture } from '.'

export type WGLSL_SAMPLER_TYPE = 'sampler' | 'sampler_comparison'
export type WGLSL_TEXTURE_TYPE =
  | 'texture_1d'
  | 'texture_2d'
  | 'texture_2d_array'
  | 'texture_3d'
  | 'texture_cube'
  | 'texture_cube_array'
  | 'texture_multisampled_2d'
  | 'texture_depth_2d'
  | 'texture_depth_2d_array'
  | 'texture_depth_cube'
  | 'texture_depth_cube_array'
  | 'texture_depth_multisampled_2d'

export type WGLSL_INPUT_TYPE =
  | 'mat4x4<f32>'
  | 'mat3x3<f32>'
  | 'vec4<f32>'
  | 'vec3<f32>'
  | 'vec2<f32>'
  | 'f32'
  | 'i32'
  | 'u32'
  | 'i16'
  | 'u16'

// Optional varyings
interface Varying {
  type: GPUVertexFormat
}

export interface VaryingsInputs {
  [key: string]: Varying
}

// Uniforms
interface Uniform {
  type: WGLSL_INPUT_TYPE
  value: ArrayBuffer | SharedArrayBuffer
}

export interface UniformDefinition extends Uniform {
  byteOffset: GPUSize64
}

export interface UniformInputs {
  [key: string]: Uniform
}

export interface UniformsDefinitions {
  [key: string]: UniformDefinition
}

export interface ShaderDefinition {
  head?: string
  main: string
}

// Mesh props
export interface MeshInput {
  geometry: Geometry
  vertexShaderSource: ShaderDefinition
  fragmentShaderSource: ShaderDefinition
  uniforms?: UniformInputs
  textures?: Texture[]
  samplers?: Sampler[]
  customVaryings?: VaryingsInputs
  multisample?: GPUMultisampleState
  depthStencil?: GPUDepthStencilState
  targets?: GPUColorTargetState[]
  /**
   * @default 'triangle-list'
   */
  primitiveType?: GPUPrimitiveTopology
}
