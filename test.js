const test = require('tape')
const NdarrayType = require('./type')

const Ndarray = require('./')

test('t-ndarray', function(t) {
  t.ok(Ndarray, 'module is require-able')
  t.end()
})

test('meta', function (t) {
  t.deepEqual(Ndarray.meta, NdarrayType.meta)
  t.end()
})

test('is', function (t) {
  var options = {
    data: [0],
    shape: [1]
  }
  var ndarray = Ndarray(options)
  t.equal(Ndarray.is, NdarrayType.is)
  t.ok(Ndarray.is(ndarray))
  t.end()
})

test('get/set', function (t) {
  var ndarray = Ndarray({
    data: [0, 1, 2, 3],
    shape: [2, 2]
  })
  t.equal(ndarray.get(0, 0), 0)
  t.equal(ndarray.get(1, 0), 2)
  ndarray.set(1, 0, 8)
  t.equal(ndarray.get(1, 0), 8)
  t.end()
})

test('pick', function (t) {
  var ndarray = Ndarray({
    data: [
      0, 0, 0,
      0xff, 0, 0,
      0, 0xff, 0,
      0xff, 0xff, 0
    ],
    shape: [4, 3]
  })
  var item = ndarray.pick(0)
  t.ok(Ndarray.is(item))
  t.deepEqual(item.shape, [3])
  t.equal(item.get(0), 0)
  t.equal(item.get(1), 0)
  t.equal(item.get(2), 0)
  t.equal(item.get(3), 0xff)
  t.end()
})
