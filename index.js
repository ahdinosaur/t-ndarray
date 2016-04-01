var t = require('tcomb')
var NdarrayType = require('./type')
var createNdarray = require('ndarray')

var Ndarray = t.func(
  [NdarrayType], NdarrayType, 'ndarrayFunc'
).of(ndarrayFunc)

Ndarray.is = NdarrayType.is
Ndarray.meta = NdarrayType.meta

module.exports = Ndarray

function ndarrayFunc (options) {
  // get options
  var data = options.data
  var shape = options.shape
  var stride = options.stride
  var offset = options.offset

  // create compiled ndarray factory
  var array = createNdarray(
    data, shape, stride, offset
  )

  return array
}
