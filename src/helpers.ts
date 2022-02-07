import { UniformDefinition, UniformInputs } from '.'
import { UNIFORM_ALIGNMENT_SIZE_MAP } from './constants'

// Uniform structs using std140 layout, so each block needs to be 16 bytes aligned
// Taken from FUNGI by @sketchpunk
// https://github.com/sketchpunk/Fungi/blob/f73e8affa68219dce6d1934f6512fa6144ba5815/fungi/core/Ubo.js#L119
let _uniformBlockSpace = 16
let _prevUniform: UniformDefinition
let _uniformByteLength = 0
export const alignUniformsToStd140Layout = (
  uniforms: UniformInputs,
): [number, UniformDefinition[]] => {
  const uniformDefinitions: UniformDefinition[] = []
  for (const uniform of Object.values(uniforms)) {
    const uniformSize = UNIFORM_ALIGNMENT_SIZE_MAP.get(uniform.type)
    if (!uniformSize) {
      throw new Error('cant find uniform mapping')
    }

    const [alignment, size] = uniformSize

    if (_uniformBlockSpace >= alignment) {
      _uniformBlockSpace -= size
    } else if (
      _uniformBlockSpace > 0 &&
      _prevUniform &&
      !(_uniformBlockSpace === 16 && size === 16)
    ) {
      _prevUniform.byteSize += _uniformBlockSpace
      _uniformByteLength += _uniformBlockSpace
      _uniformBlockSpace = 16 - size
    }

    const uniformDefinition = {
      byteOffset: _uniformByteLength,
      byteSize: size,
      ...uniform,
    }

    uniformDefinitions.push(uniformDefinition)

    _uniformByteLength += size
    _prevUniform = uniformDefinition
    if (_uniformByteLength <= 0) {
      _uniformBlockSpace = 16
    }
  }
  const byteLength = _uniformByteLength
  _uniformBlockSpace = 16
  _prevUniform = null
  _uniformByteLength = 0

  return [byteLength, uniformDefinitions]
}

// Borrowed from https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
export const stringToHash = (str: string): number => {
  let hash = 0
  if (str.length == 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}
