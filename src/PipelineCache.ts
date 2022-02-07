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

// Borrowed from https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function stringToHash(str: string): number {
  let hash = 0
  if (str.length == 0) return hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}
