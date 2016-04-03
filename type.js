var Tc = require('tcomb')
var defaults = require('tcomb-defaults')
var getDtype = require('./dtype')

// special case for -1 dimensional array
var TrivialNdarray = Tc.struct({
  data: Tc.Any
}, 'TrivialNdarray')

Object.defineProperties(TrivialNdarray.prototype, {
  dtype: { get: function () { return getDtype(this.data) } },
  dimension: { get: function () { return -1 } },
  size: { get: function () { return 0 } },
  shape: { value: function () { return [] } },
  stride: { value: function () { return [] } },
  order: { value: function () { return [] } },
  index: { value: function () { return -1 } },
  lo: { value: function () { return TrivialNdarray({ data: this.data }) } },
  hi: { value: function () { return TrivialNdarray({ data: this.data }) } },
  transpose: { value: function () { return TrivialNdarray({ data: this.data }) } },
  step: { value: function () { return TrivialNdarray({ data: this.data }) } },
  get: { value: function () { } },
  set: { value: function () { } },
  pick: { value: function () { return null } }
})

var Ndarray = TrivialNdarray.extend({
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
  dtype: { get: function () { return getDtype(this.data) } },
  size: { get: function () {
    return this.shape.reduce(mult, 1)
  } },
  dimension: { get: function () {
    return this.shape.length
  } },
  order: { get: function () {
    var stride = this.stride
    var terms = new Array(stride.length)
    var i
    for(i=0; i<terms.length; ++i) {
      terms[i] = [Math.abs(stride[i]), i]
    }
    terms.sort(compare1st)
    var result = new Array(terms.length)
    for(i=0; i<result.length; ++i) {
      result[i] = terms[i][1]
    }
    return result
  } },
  get: { value: function () {
    var index = this.index.apply(this, arguments)
    return (this.dtype === 'generic') ?
      this.data.get(index) : this.data[index]
  } },
  valueOf: { value: function () {
    if (this.dimension === 0) {
      return this.get()
    }
  } },
  set: { value: function () {
    var index = this.index.apply(this, arguments)
    var value = arguments[arguments.length - 1]
    return (this.dtype === 'generic') ?
      this.data.set(index, value) : (this.data[index] = value)
  } },
  index: { value: function () {
    var args = slice(arguments, 0, this.dimension)
    return args
    .map(function (value, index) {
      return value * this.stride[index]
    }, this)
    .reduce(add, this.offset)
  } },
  hi: { value: function () {
    var args = slice(arguments, 0, this.dimension)
    var nextShape = this.shape.map(function (prev, index) {
      var next = args[index]
      return (Tc.Number.is(next) && next >= 0) ? next : prev
    })
    return Ndarray.update(this, { shape: { $set: nextShape } })
  } },
  lo: { value: function () {
    var args = slice(arguments, 0, this.dimension)
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
    var args = slice(arguments, 0, this.dimension)
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
    var args = slice(arguments, 0, this.dimension)
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
    // special case for when dimension is already 0
    if (this.dimension === 0) {
      return TrivialNdarray({ data: this.data })
    }
    var args = slice(arguments, 0, this.dimension)
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

function compare1st(a, b) {
  return a[0] - b[0]
}
function add (a, b) { return a + b }
function mult (a, b) { return a * b }
function slice (arr, start, end) {
  var sliced = Array.prototype.slice.call(arr, start, end)
  if ((end - start) > sliced.length) {
    var prevLength = sliced.length
    sliced.length = end
    sliced.fill(null, prevLength, end)
  }
  return sliced
}
