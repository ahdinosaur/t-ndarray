var hasTypedArrays  = ((typeof Float64Array) !== "undefined")

module.exports = getDtype

function getDtype (data) {
  if(Buffer.isBuffer(data)) {
    return "buffer"
  }

  if(hasTypedArrays) {
    switch(Object.prototype.toString.call(data)) {
      case "[object Float64Array]":
        return "float64"
      case "[object Float32Array]":
        return "float32"
      case "[object Int8Array]":
        return "int8"
      case "[object Int16Array]":
        return "int16"
      case "[object Int32Array]":
        return "int32"
      case "[object Uint8Array]":
        return "uint8"
      case "[object Uint16Array]":
        return "uint16"
      case "[object Uint32Array]":
        return "uint32"
      case "[object Uint8ClampedArray]":
        return "uint8_clamped"
    }
  }

  if(Array.isArray(data)) {
    return "array"
  }

  return "generic"
}
