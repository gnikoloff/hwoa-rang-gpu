import { ComputeShader } from './shader/ComputeShader'
import { StorageBuffer } from './buffers/StorageBuffer'
import { BindGroup, GPUComputeInput, UniformsDefinitions } from '.'
import { UNIFORM_TYPES_MAP } from './constants'

export class GPUCompute {
  private device: GPUDevice
  private workgroupSize: number[]
  private uboBindGroup?: BindGroup
  private pipeline: GPUComputePipeline

  public uniforms: UniformsDefinitions = {}
  public storages: StorageBuffer[]

  constructor(
    device: GPUDevice,
    {
      workgroupSize = [64, 1, 1],
      uniforms = {},
      storages = [],
      shaderSource,
    }: GPUComputeInput,
  ) {
    this.device = device
    this.workgroupSize = workgroupSize
    this.storages = storages

    let uniformsInputUBOByteLength = 0
    for (const [key, uniform] of Object.entries(uniforms)) {
      this.uniforms[key] = {
        byteOffset: uniformsInputUBOByteLength,
        ...uniform,
      }
      const uniformInfo = UNIFORM_TYPES_MAP.get(uniform.type)
      if (!uniformInfo) {
        throw new Error('cant find uniform mapping')
      }
      const [val, bytesPerElement] = uniformInfo
      uniformsInputUBOByteLength += val * bytesPerElement
    }

    this.uboBindGroup = new BindGroup(device, 0).addUBO(
      uniformsInputUBOByteLength,
    )

    if (uniformsInputUBOByteLength) {
      // Pass optional initial uniform values
      for (const { value, byteOffset } of Object.values(this.uniforms)) {
        this.uboBindGroup.writeToUBO(0, byteOffset, value)
      }
    }
    // Supply storages to bind group
    storages.forEach((storage) => this.uboBindGroup.addStorage(storage))

    // Construct a compute shader based on inputs
    const computeShader = new ComputeShader(device)
    if (uniformsInputUBOByteLength) {
      computeShader.addUniformInputs(uniforms, 0)
    }
    computeShader
      .addStorages(
        storages.map(({ dataStride, structDefinition, name }, i) => ({
          // increment by 1 to account for the UBO at binding 0
          bindIdx: i + 1,
          name,
          attributes: structDefinition,
          dataStride,
        })),
      )
      .addHeadSnippet(shaderSource.head)
      .addComputeStageWorkgroupSize(workgroupSize)
      .addMainFnSnippet(shaderSource.main)
    console.log(computeShader.source)

    // Create compute pipeline
    const pipelineDesc: GPUComputePipelineDescriptor = {
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.uboBindGroup.getLayout()],
      }),
      compute: {
        entryPoint: ComputeShader.ENTRY_FUNCTION,
        module: computeShader.shaderModule,
      },
    }
    this.pipeline = device.createComputePipeline(pipelineDesc)

    this.uboBindGroup.attachToPipeline(this.pipeline)
  }

  setUniform(name: string, value: SharedArrayBuffer | ArrayBuffer): this {
    const uniform = this.uniforms[name]
    if (!uniform) {
      throw new Error('Uniform does not belong to UBO')
    }
    this.uboBindGroup.writeToUBO(0, uniform.byteOffset, value)
    return this
  }

  dispatch(
    computePass: GPUComputePassEncoder,
    x: number = 1,
    y: number = 1,
    z: number = 1,
  ): void {
    this.uboBindGroup.bind(computePass)
    computePass.setPipeline(this.pipeline)
    computePass.dispatch(x, y, z)
  }

  destroy(): void {
    this.uboBindGroup.destroy()
  }
}
