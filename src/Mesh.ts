import {
  SceneObject,
  OrthographicCamera,
  PerspectiveCamera,
} from './lib/hwoa-rang-gl/src'

import {
  UNIFORM_ALIGNMENT_SIZE_MAP,
  PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
} from './constants'

import { Geometry } from './Geometry'
import { Shader } from './shader/Shader'
import { BindGroup } from './BindGroup'
import { Sampler } from './Sampler'
import { MeshInput, UniformsDefinitions, UniformDefinition } from './types'
import { Texture } from './Texture'
import { VertexShader } from './shader/VertexShader'
import { FragmentShader } from './shader/FragmentShader'
import PipelineCache from './PipelineCache'

/**
 * @public
 */
export class Mesh extends SceneObject {
  private device: GPUDevice
  protected renderable = true

  public uniforms: UniformsDefinitions = {}
  public geometry: Geometry
  public pipeline: GPURenderPipeline
  public uboBindGroup: BindGroup

  constructor(
    device: GPUDevice,
    {
      geometry,
      uniforms = {},
      storages = [],
      textures = [],
      samplers = [],

      vertexShaderSource,
      fragmentShaderSource,

      multisample = {},
      depthStencil = {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },

      targets = [{ format: 'bgra8unorm' }],
      primitiveType = PRIMITIVE_TOPOLOGY_TRIANGLE_LIST,
    }: MeshInput,
  ) {
    super()

    geometry.primitiveType = primitiveType

    this.device = device
    this.geometry = geometry

    // Each Mesh comes with predetermined UBO called Transforms
    // There is a second optional UBO that holds every user-supplied uniform

    // Uniform structs using std140 layout, so each block needs to be 16 bytes aligned
    // Taken from FUNGI by @sketchpunk
    // https://github.com/sketchpunk/Fungi/blob/f73e8affa68219dce6d1934f6512fa6144ba5815/fungi/core/Ubo.js#L119
    let uniformBlockSpace = 16
    let prevUniform: UniformDefinition | null = null

    let uniformsInputUBOByteLength = 0
    for (const [key, uniform] of Object.entries(uniforms)) {
      const uniformSize = UNIFORM_ALIGNMENT_SIZE_MAP.get(uniform.type)
      if (!uniformSize) {
        throw new Error('cant find uniform mapping')
      }

      const [alignment, size] = uniformSize

      if (uniformBlockSpace >= alignment) {
        uniformBlockSpace -= size
      } else if (
        uniformBlockSpace > 0 &&
        prevUniform &&
        !(uniformBlockSpace === 16 && size === 16)
      ) {
        prevUniform.byteSize += uniformBlockSpace
        uniformsInputUBOByteLength += uniformBlockSpace
        uniformBlockSpace = 16 - size
      }

      const uniformDefinition = {
        byteOffset: uniformsInputUBOByteLength,
        byteSize: size,
        ...uniform,
      }

      uniformsInputUBOByteLength += size
      prevUniform = uniformDefinition
      if (uniformsInputUBOByteLength <= 0) {
        uniformBlockSpace = 16
      }
    }

    // Offset shader binding counter by 1 in case of values for optional UBO
    const numBindOffset = uniformsInputUBOByteLength ? 2 : 1

    // Generate vertex & fragment shaders based on
    // - vertex inputs
    // - uniform inputs
    // - sampler inputs
    // - texture inputs
    // - custom user string snippets
    const vertexShader = new VertexShader(device)
    const fragmentShader = new FragmentShader(device)
    {
      // Generate vertex shader
      if (uniformsInputUBOByteLength) {
        vertexShader.addUniformInputs(uniforms)
      }

      vertexShader
        .addShaderVars(geometry.vertexBuffers, vertexShaderSource.outputs)
        .addSamplerInputs(
          samplers.map(({ name, wglslSamplerType }, i) => ({
            bindIdx: numBindOffset + i,
            name: name,
            type: wglslSamplerType,
          })),
        )
        .addTextureInputs(
          textures.map(({ name, wglslTextureType }, i) => ({
            bindIdx: numBindOffset + samplers.length + i,
            name: name,
            type: `${wglslTextureType}`,
          })),
        )
        .addStorages(
          storages.map(({ dataStride, structDefinition, name }, i) => ({
            bindIdx: numBindOffset + samplers.length + textures.length + i,
            name,
            attributes: structDefinition,
            dataStride,
          })),
        )
        .addHeadSnippet(vertexShaderSource.head)
        .addMainFnSnippet(vertexShaderSource.main)
    }
    {
      // Generate fragment shader
      if (uniformsInputUBOByteLength) {
        fragmentShader.addUniformInputs(uniforms)
      }

      fragmentShader
        .addShaderVars(
          geometry.vertexBuffers,
          fragmentShaderSource.inputs,
          fragmentShaderSource.outputs,
        )
        .addSamplerInputs(
          samplers.map(({ name, wglslSamplerType }, i) => ({
            bindIdx: numBindOffset + i,
            name: name,
            type: wglslSamplerType,
          })),
        )
        .addTextureInputs(
          textures.map(({ name, wglslTextureType }, i) => ({
            bindIdx: numBindOffset + samplers.length + i,
            name: name,
            type: `${wglslTextureType}`,
          })),
        )
        .addStorages(
          storages.map(({ name, dataStride, structDefinition }, i) => ({
            dataStride,
            bindIdx: numBindOffset + samplers.length + textures.length + i,
            name,
            attributes: structDefinition,
          })),
        )
        .addHeadSnippet(fragmentShaderSource.head)
        .addMainFnSnippet(fragmentShaderSource.main)
    }

    // console.log(vertexShader.source)
    // console.log(fragmentShader.source)

    this.uboBindGroup = new BindGroup(device, 0)

    // First bind group with dedicated first binding containing required uniforms:
    // 1. camera projection matrix
    // 2. camera view matrix
    // 3. model world matrix
    // 4. model normal matrix
    const numberOfTransformMatrices = 4
    this.uboBindGroup.addUBO(
      16 * numberOfTransformMatrices * Float32Array.BYTES_PER_ELEMENT,
    )

    // Bind sectond optional UBO only if extra uniforms are passed
    if (uniformsInputUBOByteLength) {
      this.uboBindGroup.addUBO(uniformsInputUBOByteLength)
    }
    // Pass optional initial uniform values to second binding on GPU
    for (const { value, byteOffset } of Object.values(this.uniforms)) {
      this.uboBindGroup.writeToUBO(1, byteOffset, value)
    }

    // Supply all samplers and textures to bind group
    samplers.forEach((sampler: Sampler) =>
      this.uboBindGroup.addSampler(sampler),
    )
    textures.map((texture: Texture) => this.uboBindGroup.addTexture(texture))

    // Supply storages to bind group
    storages.forEach((storage) => this.uboBindGroup.addStorage(storage))

    const pipelineDesc: GPURenderPipelineDescriptor = {
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.uboBindGroup.getLayout()],
      }),
      vertex: {
        module: vertexShader.shaderModule,
        entryPoint: Shader.ENTRY_FUNCTION,
        buffers: geometry.getVertexBuffersLayout(),
      },
      fragment: {
        module: fragmentShader.shaderModule,
        entryPoint: Shader.ENTRY_FUNCTION,
        targets,
      },
      primitive: {
        topology: primitiveType,
        stripIndexFormat: geometry.stripIndexFormat,
      },
      multisample,
    }

    if (depthStencil) {
      pipelineDesc.depthStencil = depthStencil
    }

    // Reuse pipelines from a pool
    PipelineCache.device = device
    this.pipeline = PipelineCache.instance.getRenderPipeline(pipelineDesc)

    this.uboBindGroup.attachToPipeline(this.pipeline)
  }

  setUniform(name: string, value: SharedArrayBuffer | ArrayBuffer): this {
    const uniform = this.uniforms[name]
    if (!uniform) {
      throw new Error('Uniform does not belong to UBO')
    }
    this.uboBindGroup.writeToUBO(1, uniform.byteOffset, value)
    return this
  }

  render(
    renderPass: GPURenderPassEncoder,
    camera: PerspectiveCamera | OrthographicCamera,
  ): void {
    this.updateWorldMatrix(this.parentNode?.worldMatrix)

    // Update base UBO that holds global transforms
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
      .writeToUBO(0, 0, camera.projectionMatrix as ArrayBuffer)
      .writeToUBO(
        0,
        16 * Float32Array.BYTES_PER_ELEMENT,
        camera.viewMatrix as ArrayBuffer,
      )

    this.uboBindGroup.bind(renderPass)
    renderPass.setPipeline(this.pipeline)
    this.geometry.draw(renderPass)
  }

  destroy(): void {
    this.uboBindGroup.destroy()
  }
}
