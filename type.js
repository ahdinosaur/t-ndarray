var t = require('tcomb')
var isNdarray = require('isndarray')

var Options = t.struct({
  data: t.Any,
  shape: t.list(t.Number),
  stride: t.maybe(t.list(t.Number)),
  offset: t.maybe(t.Number)
}, 'NdarrayOptions')

var Compiled = t.irreducible('NdarrayCompiled', isNdarray)

var Ndarray = t.union([
  Options, Compiled
], 'Ndarray')

Ndarray.dispatch = function dispatchNdarray (value) {
  if (Compiled.is(value)) {
    return Compiled
  } else {
    return Options
  }
}

module.exports = Ndarray
