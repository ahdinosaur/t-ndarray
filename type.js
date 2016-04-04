'use strict';

var Tc = require('tcomb')
var setDefaults = require('tcomb-defaults')
var getDtype = require('./dtype')
var slice = require('sliced')
var dp = require('describe-property')

// special case for -1 dimensional array
var TrivialNdarray = Tc.struct({
  data: Tc.Any
}, 'TrivialNdarray')

Object.defineProperties(TrivialNdarray.prototype, {
  type: dp.gs(function () { return TrivialNdarray }),
  dtype: dp.gs(function () { return getDtype(this.data) }),
  dimension: dp.gs(function () { return -1 }),
  size: dp.gs(function () { return 0 }),
  shape: dp(function () { return [] }),
  stride: dp(function () { return [] }),
  order: dp(function () { return [] }),
  index: dp(function () { return -1 }),
  lo: dp(function () { return TrivialNdarray({ data: this.data }) }),
  hi: dp(function () { return TrivialNdarray({ data: this.data }) }),
  transpose: dp(function () { return TrivialNdarray({ data: this.data }) }),
  step: dp(function () { return TrivialNdarray({ data: this.data }) }),
  get: dp(function () { }),
  set: dp(function () { }),
  pick: dp(function () { return null })
})

var Ndarray = TrivialNdarray.extend({
  shape: Tc.maybe(Tc.list(Tc.Number)),
  stride: Tc.maybe(Tc.list(Tc.Number)),
  offset: Tc.maybe(Tc.Number)
}, 'Ndarray')

var defaults = {
  shape: defaultShape,
  stride: defaultStride,
  offset: defaultOffset
}

Object.defineProperties(Ndarray.prototype, {
  type: dp.gs(function () { return Ndarray }),
  size: dp.gs(function () {
    var size = 1
    for (var i = 0; i < this.shape.length; ++i) {
      size *= this.shape[i]
    }
    return size
  }),
  dimension: dp.gs(function () {
    return this.shape.length
  }),
  order: dp.gs(function () {
    var stride = this.stride
    var terms = new Array(stride.length)
    for(var i = 0; i < terms.length; ++i) {
      terms[i] = [Math.abs(stride[i]), i]
    }
    terms.sort(compare1st)
    var result = new Array(terms.length)
    for(i=0; i < result.length; ++i) {
      result[i] = terms[i][1]
    }
    return result
  }),
  get: dp(function () {
    var index = this.index.apply(this, arguments)
    return (this.dtype === 'generic') ?
      this.data.get(index) : this.data[index]
  }),
  valueOf: dp(function () {
    if (this.dimension === 0) {
      return this.get()
    }
  }),
  set: dp(function () {
    var index = this.index.apply(this, arguments)
    var value = arguments[this.dimension]
    return (this.dtype === 'generic') ?
      this.data.set(index, value) : (this.data[index] = value)
  }),
  index: dp(function () {
    var index = this.offset
    for (var i = 0; i < this.dimension; ++i) {
      index += arguments[i] * this.stride[i]
    }
    return index
  }),
  hi: dp(function () {
    var args = sliceArgs(arguments, 0, this.dimension)
    var nextShape = new Array(this.shape.length)
    for (var i = 0; i < this.shape.length; ++i) {
      var prev = this.shape[i]
      var next = args[i]
      nextShape[i] = (
        Tc.Number.is(next) && next >= 0
      ) ? next : prev
    }
    return this.type.update(this, { shape: { $set: nextShape } })
  }),
  lo: dp(function () {
    var args = sliceArgs(arguments, 0, this.dimension)
    var nextShape = this.shape.slice()
    var nextOffset = this.offset
    for (var i = 0; i < args.length; ++i) {
      var arg = args[i]
      if (Tc.Number.is(arg) && arg >= 0) {
        nextOffset += this.stride[i] * arg
        nextShape[i] -= arg
      }
    }
    return this.type.update(this, {
      shape: { $set: nextShape },
      offset: { $set: nextOffset }
    })
  }),
  step: dp(function () {
    var args = sliceArgs(arguments, 0, this.dimension)
    var nextShape = this.shape.slice()
    var nextStride = this.stride.slice()
    var nextOffset = this.offset
    // TODO for loop
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
    return this.type.update(this, {
      shape: { $set: nextShape },
      stride: { $set: nextStride },
      offset: { $set: nextOffset }
    })
  }),
  transpose: dp(function () {
    var args = sliceArgs(arguments, 0, this.dimension)
    var nextShape = this.shape.slice()
    var nextStride = this.stride.slice()
    var nextOffset = this.offset
    // TODO for loop
    args.forEach(function (arg, index) {
      if (Tc.Nil.is(arg)) { arg = index }
      nextShape[index] = this.shape[arg]
      nextStride[index] = this.stride[arg]
    }, this)
    return this.type.update(this, {
      shape: { $set: nextShape },
      stride: { $set: nextStride },
      offset: { $set: nextOffset }
    })
  }),
  pick: dp(function () {
    // special case for when dimension is already 0
    if (this.dimension === 0) {
      return TrivialNdarray({ data: this.data })
    }
    var args = sliceArgs(arguments, 0, this.dimension)
    var nextShape = []
    var nextStride = []
    var nextOffset = this.offset
    // TODO for loop
    args.forEach(function (arg, index) {
      if (Tc.Number.is(arg) && arg >= 0) {
        nextOffset = (nextOffset + this.stride[index] * arg)
      } else {
        nextShape.push(this.shape[index])
        nextStride.push(this.stride[index])
      }
    }, this)
    return this.type.update(this, {
      shape: { $set: nextShape },
      stride: { $set: nextStride },
      offset: { $set: nextOffset }
    })
  })
})

module.exports = setDefaults(Ndarray, defaults)

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

function sliceArgs (arr, start, end) {
  var sliced = slice(arr, start, end)
  if ((end - start) > sliced.length) {
    var prevLength = sliced.length
    sliced.length = end
    sliced.fill(null, prevLength, end)
  }
  return sliced
}

function add (a, b) { return a + b }
function mult (a, b) { return a * b }
function compare1st(a, b) { return a[0] - b[0] }
