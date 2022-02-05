export const ATTRIB_NAME_POSITION = 'position'

export const PRIMITIVE_TOPOLOGY_POINTS = 'point-list'
export const PRIMITIVE_TOPOLOGY_LINE_LIST = 'line-list'
export const PRIMITIVE_TOPOLOGY_LINE_STRIP = 'line-strip'
export const PRIMITIVE_TOPOLOGY_TRIANGLE_LIST = 'triangle-list'
export const PRIMITIVE_TOPOLOGY_TRIANGLE_STRIP = 'triangle-strip'

// return [Alignment, Size]
export const UNIFORM_ALIGNMENT_SIZE_MAP: Map<string, [number, number]> =
  new Map([
    ['mat4x4<f32>', [64, 64]], // 16 * 4
    ['mat3x3<f32>', [48, 48]], // 16 * 3
    ['vec4<f32>', [16, 16]],
    ['vec3<f32>', [16, 12]], // special case
    ['vec2<f32>', [8, 8]],
    ['f32', [4, 4]],
    ['i32', [4, 4]],
    ['u32', [4, 4]],
    ['i16', [2, 2]],
    ['u16', [2, 2]],
  ])
