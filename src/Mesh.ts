import {
  SceneObject,
  OrthographicCamera,
  PerspectiveCamera,
} from './lib/hwoa-rang-gl/src'

// import { SceneObject } from './lib/hwoa-rang-gl/src/core/scene-object'
// import { OrthographicCamera } from './lib/hwoa-rang-gl/src/camera/orthographic-camera'
// import { PerspectiveCamera } from './lib/hwoa-rang-gl/src/camera/perspective-camera'

import {
  UNIFORM_TYPES_MAP,
  PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
} from './constants'

import { Geometry } from './Geometry'
import { gpuPipelineFactory } from './gpu-pipeline-factory'
import { Shader } from './Shader'
import { UniformBindGroup } from './UniformBindGroup'
import { UniformSampler } from './UniformSampler'

export class Mesh extends SceneObject {
  private device: GPUDevice
  protected renderable = true

  geometry: Geometry
  pipeline: GPURenderPipeline
  uniforms: { [name: string]: Uniform }
  uboBindGroup: UniformBindGroup
  uniqueUBOByteLength: number = 0

  constructor(
    device: GPUDevice,
    {
      geometry,
      uniforms = {},
      textures = [],
      samplers = [],

      vertexShaderSnippetHead = '',
      vertexShaderSnippetMain,

      fragmentShaderSnippetHead = '',
      fragmentShaderSnippetMain,

      multisample = {},
      depthStencil = {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },

      presentationFormat = 'bgra8unorm',
      primitiveType = PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
    }: MeshProps,
  ) {
    super()

    console.log(depthStencil)

    geometry.primitiveType = primitiveType

    this.device = device
    this.geometry = geometry
    this.uniforms = uniforms

    // Each Mesh comes with predetermined UBO called Transforms
    // There is a second optional UBO called UniformsInput that holds every other uniform
    this.uniqueUBOByteLength = Object.values(uniforms).reduce(
      (acc, { type }) => {
        const uniformInfo = UNIFORM_TYPES_MAP.get(type)
        if (uniformInfo) {
          const [val, arrayType] = uniformInfo
          acc += val * arrayType.BYTES_PER_ELEMENT
        }
        return acc
      },
      0,
    )
    // debugger
    const numBindOffset = this.uniqueUBOByteLength ? 2 : 1

    // Generate vertex & fragment shaders based on
    // - vertex inputs
    // - uniform inputs
    // - sampler inputs
    // - texture inputs
    // - custom user string snippets
    const vertexShader = new Shader(
      device as GPUDevice,
      GPUShaderStage.VERTEX as GPUShaderStageFlags,
    )
    if (this.uniqueUBOByteLength) {
      vertexShader.addUniformInputs(Object.entries(uniforms))
    }
    vertexShader.addVertexInputs(geometry.getVertexBuffers())
    vertexShader.addHeadSnippet(vertexShaderSnippetHead)
    vertexShader.addMainFnSnippet(vertexShaderSnippetMain)

    const fragmentShader = new Shader(
      device as GPUDevice,
      GPUShaderStage.FRAGMENT as GPUShaderStageFlags,
    )
    if (this.uniqueUBOByteLength) {
      fragmentShader.addUniformInputs(Object.entries(uniforms))
    }
    fragmentShader.addVertexInputs(geometry.getVertexBuffers())
    fragmentShader.addTextureInputs(
      textures.map(({ name }, i: number) => ({
        bindIdx: numBindOffset + i,
        name: name,
      })),
    )
    fragmentShader.addSamplerInputs(
      samplers.map((sampler: UniformSampler, i: number) => {
        const bindIdx = numBindOffset + textures.length + i
        return {
          bindIdx,
          name: sampler.name,
        }
      }),
    )
    fragmentShader.addHeadSnippet(fragmentShaderSnippetHead)
    fragmentShader.addMainFnSnippet(fragmentShaderSnippetMain)

    // console.log(vertexShader.source)
    // console.log(fragmentShader.source)

    this.uboBindGroup = new UniformBindGroup(device, 0)
    // First bind group with dedicated first binding containing required uniforms:

    // 1. camera projection matrix
    // 2. camera view matrix
    // 3. model world matrix
    // 4. model normal matrix
    this.uboBindGroup.addUBO(0, 16 * 4 * Float32Array.BYTES_PER_ELEMENT)

    if (this.uniqueUBOByteLength) {
      // Second binding with optional uniforms
      this.uboBindGroup.addUBO(1, this.uniqueUBOByteLength)
    }
    // Pass initial uniform values to second binding on GPU
    Object.values(this.uniforms)
      .filter(({ value }) => value)
      .forEach(({ value }, i, self) => {
        // Calc correct byte offset (sum of all previous uniforms)
        const byteOffset = self
          .filter((_, n) => n < i)
          .reduce((acc, { type }) => {
            const uniformInfo = UNIFORM_TYPES_MAP.get(type)
            if (uniformInfo) {
              const [val, arrayType] = uniformInfo
              acc += val * arrayType.BYTES_PER_ELEMENT
            }
            return acc
          }, 0)
        // console.log({ byteOffset })
        this.uboBindGroup.writeToUBO(1, byteOffset, value)
      })

    // console.log(Object.keys(this.uniforms))
    // Object.keys(this.uniforms).forEach((key, i, self) => {
    //   // Calc correct byte offset (sum of all previous uniforms)
    //   const byteOffset = self
    //     .filter((_, n) => n < i)
    //     .reduce((acc, key) => {
    //       var { type } = this.uniforms[key]
    //       const uniformInfo = UNIFORM_TYPES_MAP.get(type)
    //       if (uniformInfo) {
    //         const [val, arrayType] = uniformInfo
    //         acc += val * arrayType.BYTES_PER_ELEMENT
    //       }
    //       return acc
    //     }, 0)
    //   console.log({ key, byteOffset, value: this.uniforms[key].value })
    // })

    this.pipeline = gpuPipelineFactory(
      device,
      {
        vertex: {
          module: vertexShader.shaderModule,
          entryPoint: Shader.ENTRY_FUNCTION,
          buffers: geometry.getVertexBuffersLayout(),
        },
        fragment: {
          module: fragmentShader.shaderModule,
          entryPoint: Shader.ENTRY_FUNCTION,
          targets: [
            {
              format: presentationFormat,
            },
          ],
        },
        primitive: {
          topology: primitiveType,
          stripIndexFormat: geometry.stripIndexFormat,
        },
        multisample,
        depthStencil,
      },
      uniforms,
      textures,
    )

    textures.map(({ imageBitmap }, i) => {
      const bindPointIdx = numBindOffset + i
      this.uboBindGroup.addTexture(bindPointIdx, imageBitmap)
    })

    samplers.map((sampler: UniformSampler, i) => {
      const bindPointIdx = numBindOffset + textures.length + i
      this.uboBindGroup.addSampler(bindPointIdx, sampler)
    })

    this.uboBindGroup.init(this.pipeline)
  }

  setUniform(name: string, value: SharedArrayBuffer | ArrayBuffer): this {
    const uniformIdx = Object.keys(this.uniforms).findIndex(
      (key) => key === name,
    )

    if (uniformIdx === -1) {
      throw new Error('Uniform does not belong to UBO')
    }

    const byteOffset = Object.values(this.uniforms)
      .splice(0, uniformIdx)
      .reduce((acc, { type }) => {
        const uniformInfo = UNIFORM_TYPES_MAP.get(type)
        if (uniformInfo) {
          const [val, arrayType] = uniformInfo
          acc += val * arrayType.BYTES_PER_ELEMENT
        }
        return acc
      }, 0)

    this.uboBindGroup.writeToUBO(1, byteOffset, value)

    return this
  }

  render(
    renderPass: GPURenderPassEncoder,
    camera: PerspectiveCamera | OrthographicCamera,
  ) {
    this.updateWorldMatrix(this.parentNode?.worldMatrix)

    this.uboBindGroup
      .writeToUBO(
        0,
        16 * 2 * Float32Array.BYTES_PER_ELEMENT,
        this.worldMatrix as ArrayBuffer,
      )
      .writeToUBO(
        0,
        16 * 3 * Float32Array.BYTES_PER_ELEMENT,
        this.normalMatrix as ArrayBuffer,
      )

    this.uboBindGroup
      .writeToUBO(0, 0, camera.projectionMatrix as ArrayBuffer)
      .writeToUBO(
        0,
        16 * Float32Array.BYTES_PER_ELEMENT,
        camera.viewMatrix as ArrayBuffer,
      )

    this.uboBindGroup.setActive(renderPass)

    renderPass.setPipeline(this.pipeline)
    this.geometry.draw(renderPass)
  }
}

interface MeshProps {
  geometry: Geometry
  uniforms?: { [name: string]: Uniform }
  textures?: { name: string; imageBitmap: ImageBitmap }[]
  samplers?: UniformSampler[]
  vertexShaderSnippetHead?: string
  vertexShaderSnippetMain: string

  fragmentShaderSnippetHead?: string
  fragmentShaderSnippetMain: string

  multisample?: GPUMultisampleState
  depthStencil?: GPUDepthStencilState
  /**
   * @default 'bgra8unorm'
   */
  presentationFormat?: GPUTextureFormat
  /**
   * @default 'triangle-list'
   */
  primitiveType?: GPUPrimitiveTopology
}

export interface Uniform {
  type: string
  value: SharedArrayBuffer | ArrayBuffer
}
