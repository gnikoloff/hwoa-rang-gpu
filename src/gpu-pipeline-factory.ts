const pipelinesMap = new Map()

const simpleHash = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36)
}

export const gpuPipelineFactory = (
  device: GPUDevice,
  pipelineDefinition: GPURenderPipelineDescriptor,
  uniforms,
  textures,
): GPURenderPipeline => {
  // const pipelineDefString = simpleHash(
  //   JSON.stringify({
  //     ...pipelineDefinition,
  //     uniforms,
  //     textures,
  //   }),
  // )
  const pipelineDefString = JSON.stringify({
    ...pipelineDefinition,
    uniforms,
    textures,
  })
  let pipeline = pipelinesMap.get(pipelineDefString)
  if (!pipeline) {
    pipeline = device.createRenderPipeline(pipelineDefinition)
    console.log('pipeline', pipelineDefString)
    pipelinesMap.set(pipelineDefString, pipeline)
  }
  return pipeline
}
