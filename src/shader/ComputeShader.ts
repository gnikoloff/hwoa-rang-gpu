import { WorkgroupSize } from '../types'
import { Shader } from './Shader'

export class ComputeShader extends Shader {
  addComputeStageWorkgroupSize(workgroupSize: WorkgroupSize): this {
    this.source += `
      @stage(compute) @workgroup_size(${workgroupSize.join(',')})
    `
    return this
  }
  addMainFnSnippet(shaderSnipet: string): this {
    this.source += `
      fn main([[builtin(global_invocation_id)]] GlobalInvocationID : vec3<u32>) {
        let index = GlobalInvocationID.x;
        ${shaderSnipet}
      }
    `
    return this
  }
}
