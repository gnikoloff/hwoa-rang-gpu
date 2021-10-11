# hwoa-rang-gpu

micro webgpu rendering & compute library

![Sketch render](https://github.com/gnikoloff/hwoa-rang-gpu/blob/master/preview.png?raw=true)

[![](https://img.shields.io/npm/v/hwoa-rang-gpu)](https://www.npmjs.com/package/hwoa-rang-gpu) [![](https://img.shields.io/npm/l/hwoa-rang-gpu) ](https://www.npmjs.com/package/hwoa-rang-gpu) [![size](https://badgen.net/bundlephobia/minzip/hwoa-rang-gpu)](https://bundlephobia.com/result?p=hwoa-rang-gpu) ![size](https://badgen.net/npm/types/hwoa-rang-gpu)

Built from scratch with only two hard dependencies:

- [hwoa-rang-gl](https://github.com/gnikoloff/hwoa-rang-gl) - my webgl library. I heavily borrowed the API agnostic parts of the library, so I didn't have to write them all over again:
    - perspective & orthographic camera - orbit controls - geometry generation helpers - scene graph
- [gl-matrix](https://glmatrix.net/) - used for all the math I could not bother to write myself

As WebGPU is still considered experimental, things may break. Please file an issue if you see something wrong.

### References

- [WebGPU Spec](https://www.w3.org/TR/webgpu/)
- [WebGPU Explainer](https://gpuweb.github.io/gpuweb/explainer/)
- [WebGPU Samples by Austin Eng](https://github.com/austinEng/webgpu-samples)
- [Awesome WebGPU](https://github.com/mikbry/awesome-webgpu)
