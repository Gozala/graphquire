/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false globalstrict: true */
/*global define: true */

'use strict';

var graphquire = require('../graphquire')
var utils = require('./fs')
var path = require('path')

var START_CLEANUP = exports.START_CLEANUP = 6
var DELETE_PATH = exports.DELETE_PATH = 7
var START_WRITE = exports.START_WRITE = 8
var WRITE_MODULE = exports.WRITE_MODULE = 9
var WROTE_MODULE = exports.WROTE_MODULE = 10


function clean(graph, onComplete, onProgress) {
  var modules = graph.modules
  var root = path.dirname(graph.path)
  var paths = Object.keys(modules).map(graph.resolvePath.bind(graph))
                                  .map(path.join.bind(path, root))

  var location = path.join(root, graph.cachePath)
  if (location.charAt(location.length - 1) !== '/')
    location = '/' + location
  utils.reduceTree(location, onComplete, function onReduce(entry) {
    var id = entry.substr(location.length)
    var isNative = !graphquire.isSupported(id)
    var isRequired = !paths.every(function(path) {
      return !~path.indexOf(entry)
    })

    var isReduced = !isNative && !isRequired
    if (isReduced && onProgress) onProgress(DELETE_PATH, entry)
    return isReduced
  })
  if (onProgress) onProgress(START_CLEANUP, location)
}
exports.clean = clean

function write(graph, onComplete, onProgress) {
  var id, module, modules = graph.modules, steps = 1
  function next(module, error) {
    if (error) onComplete(error)
    if (onProgress && module) onProgress(WROTE_MODULE, module)
    if (--steps === 0) onComplete(null)
  }

  for (id in modules) {
    module = modules[id]
    if (module.source) {
      steps ++
      utils.writeFile(graph.resolvePath(module.id), module.source, next.bind(null, module))
      ;delete module.source // removing source as it's no longer necessary
      if (onProgress) onProgress(WRITE_MODULE, module)
    }
  }

  next()
}
exports.write = write
