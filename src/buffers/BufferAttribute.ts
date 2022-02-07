export default class BufferAttribute {
  public offset: GPUSize64 = 0
  public size: GPUSize64 = 3
  public format: GPUVertexFormat = 'float32x4'

  constructor(
    offset: GPUSize64 = 0,
    size: GPUSize64 = 3,
    format: GPUVertexFormat = 'float32x4',
  ) {
    this.offset = offset
    this.size = size
    this.format = format
  }
}
