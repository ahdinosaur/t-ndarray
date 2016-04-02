var Tc = require('tcomb')
var defaults = require('tcomb-defaults')
var getDtype = require('./dtype')

var Ndarray = Tc.struct({
  data: Tc.Any,
  shape: Tc.maybe(Tc.list(Tc.Number)),
  stride: Tc.maybe(Tc.list(Tc.Number)),
  offset: Tc.maybe(Tc.Number)
}, 'Ndarray')

module.exports = defaults(Ndarray, {
  shape: defaultShape,
  stride: defaultStride,
  offset: defaultOffset
})

Object.defineProperties(Ndarray.prototype, {
  size: { get: function () {
    return this.shape.reduce(mult, 1)
  } },
  dtype: { get: function () {
    return getDtype(this.data)
  } },
  dimension: { get: function () {
    return this.shape.length
  } },
  get: { value: function () {
    var index = this.index.apply(this, arguments)
    return (this.dtype === 'generic') ?
      this.data.get(index) : this.data[index]
  } },
  set: { value: function () {
    var index = this.index.apply(this, arguments)
    var value = arguments[arguments.length - 1]
    return (this.dtype === 'generic') ?
      this.data.set(index, value) : (this.data[index] = value)
  } },
  index: { value: function () {
    var args = [].slice.call(arguments, 0, this.dimension)
    return args
    .map(function (value, index) {
      return value * this.stride[index]
    }, this)
    .reduce(add, this.offset)
  } },
  hi: { value: function () {
    var args = [].slice.call(arguments, 0, this.dimension)
    var nextShape = this.shape.map(function (prev, index) {
      var next = args[index]
      return (Tc.Number.is(next) && next >= 0) ?  next : prev
    })
    return Ndarray.update(this, { shape: { $set: nextShape } })
  } },
  lo: { value: function () {
    var args = [].slice.call(arguments, 0, this.dimension)
    var nextShape = this.shape.slice()
    var nextOffset = this.offset
    args.forEach(function (arg, index) {
      if (Tc.Number.is(arg) && arg >= 0) {
        nextOffset += this.stride[index] * arg
        nextShape[index] -= arg
      }
    }, this)
    return Ndarray.update(this, {
      shape: { $set: nextShape },
      offset: { $set: nextOffset }
    })
  } },
  step: { value: function () {
    var args = [].slice.call(arguments, 0, this.dimension)
    var nextShape = this.shape.slice()
    var nextStride = this.stride.slice()
    var nextOffset = this.offset
    args.forEach(function (arg, index) {
      if (Tc.Number.is(arg)) {
        if (arg < 0) {
          nextOffset += nextStride[index] * (nextShape - 1)
          nextShape[index] = Math.ceil(-nextShape[index] / arg)
        } else {
          nextShape[index] = Math.ceil(nextShape[index] / arg)
        }
        nextStride[index] *= arg
      }
    }, this)
    return Ndarray.update(this, {
      shape: { $set: nextShape },
      stride: { $set: nextStride },
      offset: { $set: nextOffset }
    })
  } },
  transpose: { value: function () {
    var args = [].slice.call(arguments, 0, this.dimension)
    var nextShape = this.shape.slice()
    var nextStride = this.stride.slice()
    var nextOffset = this.offset
    args.forEach(function (arg, index) {
      if (Tc.Nil.is(arg)) { arg = index }
      nextShape[index] = this.shape[arg]
      nextStride[index] = this.stride[arg]
    }, this)
    return Ndarray.update(this, {
      shape: { $set: nextShape },
      stride: { $set: nextStride },
      offset: { $set: nextOffset }
    })
  } },
  pick: { value: function () {
    var args = [].slice.call(arguments, 0, this.dimension)
    var nextShape = []
    var nextStride = []
    var nextOffset = this.offset
    args.forEach(function (arg, index) {
      if (Tc.Number.is(arg) && arg >= 0) {
        nextOffset = (nextOffset + this.stride[index] * arg)
      } else {
        nextShape.push(this.shape[index])
        nextStride.push(this.stride[index])
      }
    }, this)
    return Ndarray.update(this, {
      shape: { $set: nextShape },
      stride: { $set: nextStride },
      offset: { $set: nextOffset }
    })
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
