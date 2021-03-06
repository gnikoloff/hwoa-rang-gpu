import { Geometry, Sampler, StorageBuffer, Texture, UniformBuffer } from '.'

export type TYPED_ARRAY =
  | Float32Array
  | Uint32Array
  | Int32Array
  | Uint16Array
  | Int16Array
  | Uint8Array
  | Int8Array

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
  | 'f32'
  | 'vec4<f32>'
  | 'vec3<f32>'
  | 'vec2<f32>'
  | 'i32'
  | 'vec4<i32>'
  | 'vec3<i32>'
  | 'vec2<i32>'
  | 'u32'
  | 'vec4<u32>'
  | 'vec3<u32>'
  | 'vec2<u32>'
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
  value?: ArrayBuffer | SharedArrayBuffer
}

export interface UniformDefinition extends Uniform {
  byteOffset: GPUSize64
  byteSize: GPUSize64
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
  ubos?: UniformBuffer[]
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

// Buffers
export interface BufferInput {
  typedArray?: TYPED_ARRAY
  byteLength?: number
  usage?: GPUBufferUsageFlags
  mappedAtCreation?: boolean
  debugLabel?: string
}

export interface UniformBufferInput {
  name: string
  uniforms: { [key: string]: Uniform }
  usage?: GPUBufferUsageFlags
  debugLabel?: string
}

export interface IndexBufferInput extends BufferInput {}

export interface VertexBufferInput extends BufferInput {
  bindPointIdx: number
  stride?: number
  stepMode?: GPUVertexStepMode
}

export interface StorageBufferInput extends BufferInput {
  stride?: number
}

// GPUCompute

export type WorkgroupSize = [number, number, number]

export interface GPUComputeInput {
  workgroupSize?: WorkgroupSize
  uniforms?: {
    [key: string]: Uniform
  }
  storages?: StorageBuffer[]
  shaderSource: ShaderDefinition
}
