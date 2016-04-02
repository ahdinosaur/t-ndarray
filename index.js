var t = require('tcomb')
var defaults = require('tcomb-defaults')
var getDtype = require('./dtype')

var Ndarray = t.struct({
  data: t.Any,
  shape: t.maybe(t.list(t.Number)),
  stride: t.maybe(t.list(t.Number)),
  offset: t.maybe(t.Number)
}, 'Ndarray')

module.exports = defaults(Ndarray, {
  shape: defaultShape,
  stride: defaultStride,
  offset: defaultOffset
})

Object.defineProperties(Ndarray.prototype, {
  size: { get: function () {
    return this.shape.reduce(mult)
  } },
  dtype: { get: function () {
    return getDtype(this.data)
  } },
  dimension: { get: function () {
    return this.shape.length
  } },
  get: { value: function () {
      var index = this.index.apply(this, arguments)
      return this.data[index]
  } },
  set: { value: function () {
      var index = this.index.apply(this, arguments)
      var value = arguments[arguments.length - 1]
      return this.data[index] = value
  } },
  index: { value: function () {
      var indices = [].slice.call(arguments, 0, this.dimension)
      return indices
      .map(function (value, index) {
        return value * this.stride[index]
      }, this)
      .reduce(add, this.offset)
  } }
})

function add (a, b) { return a + b }
function mult (a, b) { return a * b }

function defaultShape () {
  return [this.data.length]
}

function defaultStride () {
  var shape = this.shape
  var d = shape.length
  var stride = new Array(d)
  for(var i=d-1, sz=1; i>=0; --i) {
    stride[i] = sz
    sz *= shape[i]
  }
  return stride
}

function defaultOffset () {
  var shape = this.shape
  var stride = this.stride
  var offset = 0
  for(var i=0; i < shape.length; ++i) {
    if(stride[i] < 0) {
      offset -= (shape[i]-1)*stride[i]
    }
  }
  return offset
}
