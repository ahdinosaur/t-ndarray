var createNdarray = require('ndarray')

var Ndarray = function compatNDArrayCtor (options) {
  return createNdarray(
    options.data, options.shape, options.stride, options.offset
  )
}

Ndarray.is = require('isndarray')

module.exports = Ndarray
