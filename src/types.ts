import { Geometry, Sampler, StorageBuffer, Texture } from '.'

export type WGLSL_SAMPLER_TYPE = 'sampler' | 'sampler_comparison'
// TODO: cover all cases
export type WGLSL_TEXTURE_TYPE =
  | 'texture_1d<f32>'
  | 'texture_2d<f32>'
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

export type WGLSL_BUFFER_ACCESS_MODE_TYPE =
  | '<storage>'
  | '<storage, read>'
  | '<storage, write>'
  | '<storage, read_write>'
  | '<uniform>'

// Optional varyings
export interface ShaderIOVar {
  format: GPUVertexFormat
  builtIn?: boolean
  shaderName?: string
}

// Uniforms
export interface Uniform {
  type: WGLSL_INPUT_TYPE
  value: ArrayBuffer | SharedArrayBuffer
}

export interface UniformDefinition extends Uniform {
  byteOffset: GPUSize64
  byteSize: GPUSize64
}

export interface UniformInputs {
  [key: string]: Uniform
}

export interface UniformsDefinitions {
  [key: string]: UniformDefinition
}

export interface StorageEntry {
  /**
   *
   */
  attributes: { [key: string]: WGLSL_INPUT_TYPE }
  value: Float32Array
  stride: number
}

export interface ShaderDefinition {
  outputs?: { [key: string]: ShaderIOVar }
  inputs?: { [key: string]: ShaderIOVar }
  head?: string
  main: string
}

// Mesh props
export interface MeshInput {
  geometry: Geometry
  vertexShaderSource: ShaderDefinition
  fragmentShaderSource: ShaderDefinition
  uniforms?: UniformInputs
  storages?: StorageBuffer[]
  textures?: Texture[]
  samplers?: Sampler[]
  multisample?: GPUMultisampleState
  depthStencil?: GPUDepthStencilState
  targets?: GPUColorTargetState[]
  /**
   * @default 'triangle-list'
   */
  primitiveType?: GPUPrimitiveTopology
}

// GPUCompute

export type WorkgroupSize = [number, number, number]

export interface GPUComputeInput {
  workgroupSize?: WorkgroupSize
  uniforms?: UniformInputs
  storages?: StorageBuffer[]
  shaderSource: ShaderDefinition
}
