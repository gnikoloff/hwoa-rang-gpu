import { Geometry, Mesh, VertexBuffer } from '..'

const VERTEX_SHADER_SNIPPET = `
  let worldPosition: vec4<f32> = transform.modelMatrix * input.position;
  output.Position = transform.projectionMatrix *
                    transform.viewMatrix *
                    worldPosition;
`

const FRAGMENT_SHADER_SNIPPET = `
  output.Color = inputUBO.color;
`

export default class GridHelper extends Mesh {
  constructor(
    device: GPUDevice,
    radius: number,
    divisionsCount: number,
    color = [0.5, 0.5, 0.5, 1],
  ) {
    const geometry = new Geometry()
    const scaleX = radius / divisionsCount
    const scaleY = radius / divisionsCount
    const vertexCount = divisionsCount * divisionsCount * 2
    const vertices = new Float32Array(vertexCount * 3)
    for (let i = 0; i <= divisionsCount; i += 2) {
      {
        const x1 = i * scaleX
        const y1 = 0
        const x2 = i * scaleX
        const y2 = radius
        vertices[i * 6 + 0] = x1 - radius / 2
        vertices[i * 6 + 1] = y1 - radius / 2
        vertices[i * 6 + 2] = 0
        vertices[i * 6 + 3] = x2 - radius / 2
        vertices[i * 6 + 4] = y2 - radius / 2
        vertices[i * 6 + 5] = 0
      }
      {
        const x1 = 0
        const y1 = i * scaleY
        const x2 = radius
        const y2 = i * scaleY
        vertices[i * 6 + 6] = x1 - radius / 2
        vertices[i * 6 + 7] = y1 - radius / 2
        vertices[i * 6 + 8] = 0
        vertices[i * 6 + 9] = x2 - radius / 2
        vertices[i * 6 + 10] = y2 - radius / 2
        vertices[i * 6 + 11] = 0
      }
    }
    const vertexBuffer = new VertexBuffer(
      device,
      0,
      vertices,
      3 * Float32Array.BYTES_PER_ELEMENT,
    ).addAttribute(
      'position',
      0,
      3 * Float32Array.BYTES_PER_ELEMENT,
      'float32x3',
    )
    geometry.addVertexBuffer(vertexBuffer)
    super(device, {
      geometry,
      primitiveType: 'line-list',
      multisample: {
        count: 4,
      },
      uniforms: {
        color: {
          type: 'vec4<f32>',
          value: new Float32Array(color),
        },
      },
      vertexShaderSource: {
        main: VERTEX_SHADER_SNIPPET,
      },
      fragmentShaderSource: {
        main: FRAGMENT_SHADER_SNIPPET,
      },
    })
    this.setRotation({
      x: Math.PI / 2,
    })
  }
}
