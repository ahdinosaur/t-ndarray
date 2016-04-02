var t = require('tcomb')

var Ndarray = t.struct({
  data: t.Any,
  shape: t.maybe(t.list(t.Number)),
  stride: t.maybe(t.list(t.Number)),
  offset: t.maybe(t.Number)
}, 'Ndarray')

module.exports = Ndarray
