// const pipelinesMap = new Map()

// const simpleHash = (str) => {
//   let hash = 0
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i)
//     hash = (hash << 5) - hash + char
//     hash &= hash // Convert to 32bit integer
//   }
//   return new Uint32Array([hash])[0].toString(36)
// }

export const gpuPipelineFactory = (
  device: GPUDevice,
  pipelineDefinition: GPURenderPipelineDescriptor,
  uniforms,
  textures,
  storages,
): GPURenderPipeline => {
  // TODO
  // Its suboptimal to create new render pipelines for each object.
  // Ideally, objects with similar inputs should reuse pipelines
  // Must think of a good way to dynamically group objects based on inputs
  // For now, just create new pipeline for each mesh
  const pipeline = device.createRenderPipeline(pipelineDefinition)
  return pipeline
}
