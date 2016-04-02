var t = require('tcomb')
var getDtype = require('./dtype')
var NdarrayType = require('./type')

module.exports = t.func(
  [NdarrayType], NdarrayType, 'createNdarray'
).of(createNdarray)

function createNdarray (options) {
  // default options
  // TODO clean up this mess
  var opts = {
    data: options.data,
    dtype: getDtype(options.data)
  }
  opts.shape = options.shape || defaultShape(options.data)
  opts.stride = options.stride || defaultStride(opts.shape)
  opts.offset = options.offset || defaultOffset(opts.shape, opts.stride)

  var SubType = getSubType(opts)

  var subType = SubType(opts)

  console.log(SubType.prototype.get, subType.get)

  return SubType(opts)
}

function defaultShape (data) {
  return [data.length]
}

function defaultStride (shape) {
  var d = shape.length
  var stride = new Array(d)
  for(var i=d-1, sz=1; i>=0; --i) {
    stride[i] = sz
    sz *= shape[i]
  }
  return stride
}

function defaultOffset (shape, stride) {
  var offset = 0
  for(var i=0; i < shape.length; ++i) {
    if(stride[i] < 0) {
      offset -= (shape[i]-1)*stride[i]
    }
  }
  return offset
}

var CACHED_SUBTYPES = {}

function getSubType (options) {
  var dtype = options.dtype
  var dimension = options.shape.length

  if (CACHED_SUBTYPES[dtype] === undefined) {
    CACHED_SUBTYPES[dtype] = []
  }

  if (CACHED_SUBTYPES[dtype][dimension] !== undefined) {
    return CACHED_SUBTYPES[dtype][dimension]
  }

  var size = options.shape.reduce(mult)
  var name = subTypeName(dtype, dimension)

  var SubType = t.refinement(NdarrayType,
    function (value) {
      return (
        getDtype(value.data) === dtype &&
        value.shape.length === dimension &&
        (t.Nil.is(value.stride) ? true : value.stride.length == dimension)
      )
    }
  , name)

  Object.defineProperties(SubType.prototype, {
    size: {
      get: function () { return size }
    },
    dtype: {
      get: function () { return dtype }
    },
    dimension: {
      get: function () { return dimension }
    },
    get: {
      value: function () {
        var index = this.index.apply(this, arguments)
        return this.data[index]
      }
    },
    set: {
      value: function () {
        var index = this.index.apply(this, arguments)
        var value = arguments[arguments.length - 1]
        return this.data[index] = value
      }
    },
    index: {
      value: function () {
        var indices = [].slice.call(arguments, dimension)
        return indices
        .map(function (value, index) {
          return value * this.stride[index]
        }, this)
        .reduce(add, this.offset)
      }
    }
  })

  CACHED_SUBTYPES[dtype][dimension] = SubType

  return SubType
}

function subTypeName (dtype, dimension) {
  const typeName = (dimension < 0) ?
    "View_Nil" + dtype :
    ["View", dimension, "d", dtype].join("")
}

function add (a, b) { return a + b }
function mult (a, b) { return a * b }
