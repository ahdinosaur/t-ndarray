module.exports = process.env.NODE_ENV === 'production' ?
  require('./perf') : require('./type')
