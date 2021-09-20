import { load } from '@loaders.gl/core'
import { GLTFLoader } from '@loaders.gl/gltf/dist/esm/gltf-loader'
import { Mesh, SceneObject } from '.'

export class GLTFParser {
  static traverseGLTF(gltfNode, callback) {
    const children = gltfNode.nodes || gltfNode.children || []
    callback(gltfNode, children)
    children.forEach((childNode) => {
      GLTFParser.traverseGLTF(childNode, callback)
    })
  }

  static async load(url: string) {
    const gltf = await load(url, GLTFLoader)
    return gltf
  }
}
