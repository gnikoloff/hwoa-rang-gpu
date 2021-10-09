export const ATTRIB_NAME_POSITION = 'position'

export const PRIMITIVE_TOPOLOGY_POINTS = 'point-list'
export const PRIMITIVE_TOPOLOGY_LINE_LIST = 'line-list'
export const PRIMITIVE_TOPOLOGY_LINE_STRIP = 'line-strip'
export const PRIMITIVE_TOPOLOGY_TRIANGLE_LIST = 'triangle-list'
export const PRIMITIVE_TOPOLOGY_TRIANGLE_STRIP = 'triangle-strip'

export const UNIFORM_TYPES_MAP: Map<string, [number, number]> = new Map([
  ['mat4x4<f32>', [16, Float32Array.BYTES_PER_ELEMENT]],
  ['mat3x3<f32>', [12, Float32Array.BYTES_PER_ELEMENT]],
  ['vec4<f32>', [4, Float32Array.BYTES_PER_ELEMENT]],
  ['vec3<f32>', [3, Float32Array.BYTES_PER_ELEMENT]],
  ['vec2<f32>', [2, Float32Array.BYTES_PER_ELEMENT]],
  ['f32', [1, Float32Array.BYTES_PER_ELEMENT]],
  ['i32', [1, Int32Array.BYTES_PER_ELEMENT]],
  ['u32', [1, Uint32Array.BYTES_PER_ELEMENT]],
  ['i16', [1, Int16Array.BYTES_PER_ELEMENT]],
  ['u16', [1, Uint16Array.BYTES_PER_ELEMENT]],
])
