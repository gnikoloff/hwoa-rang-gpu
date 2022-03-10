import { SceneObject } from './lib/hwoa-rang-gl/src'

import { PRIMITIVE_TOPOLOGY_TRIANGLE_LIST } from './constants'

import Geometry from './Geometry'
import Shader from './shader/Shader'
import BindGroup from './BindGroup'
import VertexShader from './shader/VertexShader'
import FragmentShader from './shader/FragmentShader'
import UniformBuffer from './buffers/UniformBuffer'

import { MeshInput } from './interfaces'

/**
 * @public
 */
export default class Mesh extends SceneObject {
  private device: GPUDevice
  protected renderable = true

  public ubos: UniformBuffer
  public geometry: Geometry
  public pipeline: GPURenderPipeline
  public uboBindGroup: BindGroup

  constructor(
    device: GPUDevice,
    {
      geometry,
      ubos = [],
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
    this.device = device
    this.geometry = geometry

    geometry.primitiveType = primitiveType

    const samplerInputs = samplers.map(({ name, wglslSamplerType }, i) => ({
      bindIdx: ubos.length + i,
      name: name,
      type: wglslSamplerType,
    }))
    const textureInputs = textures.map(({ name, wglslTextureType }, i) => ({
      bindIdx: ubos.length + samplers.length + i,
      name: name,
      type: `${wglslTextureType}`,
    }))
    const storageInputs = storages.map(
      ({ stride, structDefinition, name }, i) => ({
        bindIdx: ubos.length + samplers.length + textures.length + i,
        name,
        attributes: structDefinition,
        dataStride: stride,
      }),
    )

    const vertexShader = new VertexShader(device)
      .addUniformInputs(ubos)
      .addShaderVars(geometry.vertexBuffers, vertexShaderSource.outputs)
      .addSamplerInputs(samplerInputs)
      .addTextureInputs(textureInputs)
      .addStorages(storageInputs)
      .addHeadSnippet(vertexShaderSource.head)
      .addMainFnSnippet(vertexShaderSource.main)

    const fragmentShader = new FragmentShader(device)
      .addUniformInputs(ubos)
      .addShaderVars(
        geometry.vertexBuffers,
        fragmentShaderSource.inputs,
        fragmentShaderSource.outputs,
      )
      .addSamplerInputs(samplerInputs)
      .addTextureInputs(textureInputs)
      .addStorages(storageInputs)
      .addHeadSnippet(fragmentShaderSource.head)
      .addMainFnSnippet(fragmentShaderSource.main)
    // console.log(fragmentShader.source)

    this.uboBindGroup = new BindGroup(device, 0)

    for (const ubo of ubos) {
      this.uboBindGroup.addUBO(ubo)
    }
    for (const sampler of samplers) {
      this.uboBindGroup.addSampler(sampler)
    }
    for (const texture of textures) {
      this.uboBindGroup.addTexture(texture)
    }
    for (const storage of storages) {
      this.uboBindGroup.addStorage(storage)
    }
    this.uboBindGroup.init()

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
    // PipelineCache.device = device
    // this.pipeline = PipelineCache.instance.getRenderPipeline(pipelineDesc)
    this.pipeline = this.device.createRenderPipeline(pipelineDesc)
  }

  render(renderPass: GPURenderPassEncoder, indirectBuffer?: GPUBuffer): void {
    this.uboBindGroup.bind(renderPass)
    renderPass.setPipeline(this.pipeline)
    this.geometry.draw(renderPass, indirectBuffer)
  }

  destroy(): void {
    this.uboBindGroup.destroy()
  }
}
