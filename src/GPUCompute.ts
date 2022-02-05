import { ComputeShader } from './shader/ComputeShader'
import { StorageBuffer } from './buffers/StorageBuffer'
import {
  BindGroup,
  GPUComputeInput,
  UniformDefinition,
  UniformsDefinitions,
} from '.'
import { UNIFORM_ALIGNMENT_SIZE_MAP } from './constants'

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
