# t-ndarray

tcomb type for [n-dimensional arrays](https://github.com/scijs/ndarray/).

meant to be a friendly replacement for [`ndarray`](https://github.com/scijs/ndarray/)\*:

- [extensible validation type](https://github.com/gcanti/tcomb/)
- human-readable source code

at the expense of [reduced performance](https://github.com/ahdinosaur/ndarray-experiments) when not using [`cwise`](https://github.com/scijs/cwise).

```shell
npm install --save t-ndarray
```

\* `t-ndarray` constructor accepts options as a single object, unlike `ndarray` which accepts options as ordered arguments

## usage

see [`ndarray`](https://github.com/scijs/ndarray/) documentation for complete usage.

### `Ndarray = require('t-ndarray')`

### `ndarray = Ndarray(options)`

- required `options.data`
- `options.shape`
- `options.stride`
- `options.offset`

### `Ndarray.is(any)`

## license

The Apache License

Copyright &copy; 2016 Michael Williams

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
