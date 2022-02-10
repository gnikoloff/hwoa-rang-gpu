import { stringToHash } from './helpers'

let _instance: PipelineCache
let _device: GPUDevice

export default class PipelineCache {
  #renderPipelinePool: Map<number, GPURenderPipeline> = new Map()
  #computePipelinePool: Map<number, GPUComputePipeline> = new Map()

  static set device(v: GPUDevice) {
    if (!_device) {
      _device = v
    }
  }

  static get instance(): PipelineCache {
    if (!_device) {
      throw new Error('Must provide GPUDevice first to PipelineCache!')
    }
    if (!_instance) {
      _instance = new PipelineCache()
    }
    return _instance
  }

  async getRenderPipelineAsync(
    desc: GPURenderPipelineDescriptor,
  ): Promise<GPURenderPipeline> {
    const hash = stringToHash(JSON.stringify(desc))
    let pipeline = this.#renderPipelinePool.get(hash)
    if (pipeline) {
      return Promise.resolve(pipeline)
    }
    return _device.createRenderPipelineAsync(desc).then((renderPipeline) => {
      this.#renderPipelinePool.set(hash, renderPipeline)
      return renderPipeline
    })
  }

  async getComputePipelineAsync(
    desc: GPUComputePipelineDescriptor,
  ): Promise<GPUComputePipeline> {
    const hash = stringToHash(JSON.stringify(desc))
    let pipeline = this.#computePipelinePool.get(hash)
    if (pipeline) {
      return Promise.resolve(pipeline)
    }
    return _device.createComputePipelineAsync(desc).then((computePipeline) => {
      this.#computePipelinePool.set(hash, computePipeline)
      return computePipeline
    })
  }

  getRenderPipeline(desc: GPURenderPipelineDescriptor): GPURenderPipeline {
    const hash = stringToHash(JSON.stringify(desc))
    let pipeline = this.#renderPipelinePool.get(hash)
    if (!pipeline) {
      pipeline = _device.createRenderPipeline(desc)
      this.#renderPipelinePool.set(hash, pipeline)
    }
    return pipeline
  }

  getComputePipeline(desc: GPUComputePipelineDescriptor): GPUComputePipeline {
    const hash = stringToHash(JSON.stringify(desc))
    let pipeline = this.#computePipelinePool.get(hash)
    if (!pipeline) {
      pipeline = _device.createComputePipeline(desc)
      this.#computePipelinePool.set(hash, pipeline)
    }
    return pipeline
  }
}
