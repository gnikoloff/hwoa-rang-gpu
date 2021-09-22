export const ATTRIB_NAME_POSITION = 'position'

export const PRIMITIVE_TOPOLOGY_POINTS = 'point-list'
export const PRIMITIVE_TOPOLOGY_LINE_LIST = 'line-list'
export const PRIMITIVE_TOPOLOGY_LINE_STRIP = 'line-strip'
export const PRIMITIVE_TOPOLOGY_TRIANGLE_LIST = 'triangle-list'
export const PRIMITIVE_TOPOLOGY_TRIANGLE_STRIP = 'triangle-strip'

export const UNIFORM_TYPES_MAP: Map<
  string,
  [
    number,
    (
      | Float32ArrayConstructor
      | Uint32ArrayConstructor
      | Int32ArrayConstructor
      | Uint16ArrayConstructor
      | Int16ArrayConstructor
    ),
  ]
> = new Map([
  ['mat4x4<f32>', [16, Float32Array]],
  ['mat3x3<f32>', [12, Float32Array]],
  ['vec4<f32>', [4, Float32Array]],
  ['vec3<f32>', [3, Float32Array]],
  ['vec2<f32>', [2, Float32Array]],
  ['f32', [4, Float32Array]],
  ['i32', [4, Int32Array]],
  ['u32', [4, Uint32Array]],
  ['i16', [2, Int16Array]],
  ['u16', [2, Uint16Array]],
])
