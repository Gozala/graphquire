#!/usr/bin/env node

/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false globalstrict: true */
/*global define: true */

'use strict';

var graphquire = require('../graphquire')
var utils = require('../utils/fs')

var command = process.argv[2]
var location = process.argv[3]

if (!location) {
  location = command || process.cwd()
  command = null
}
var options = { location: location, cachePath: './node_modules' }

if (command === '-v' || command === '-d') {
  options.onProgress = function onProgress(state, data) {
    switch (state) {
      case graphquire.GET_METADATA:
        return console.log("Reading package descriptor from: " + data)
      case graphquire.GOT_METADATA:
        console.log("Package desriptor was parsed:")
        return console.log(data)
      case graphquire.GET_MODULE:
        return console.log("Searching a module: " + data.id)
      case graphquire.READ_FILE:
        return console.log("Reading module forme file: " + data)
      case graphquire.FETCH_URL:
        return console.log("Reading module from URL: " + data)
      case graphquire.GOT_MODULE:
        return console.log("Module found:", data.id, data.requirements)
    }
  }
}

exports.read = exports['-r'] = exports['--read'] = function read(options) {
  graphquire.getGraph(options, function(error, graph) {
    if (error) return console.trace(error)
    for (var id in graph.modules) {
      if (graph.modules[id].source)
        graph.modules[id].source = String(graph.modules[id].source)
    }
    console.log(JSON.stringify(graph, '', '  '))
  }, options.onProgress)
}

exports.write = exports['-w'] = exports['--write'] = function write(options) {
  var onProgress = options.onProgress
  graphquire.getGraph(options, function(error, graph) {
    if (error) return console.trace(error)

    var id, module, modules = graph.modules, steps = 0
    function next(error) {
      if (error) return console.trace(error)
      if (--steps === 0) console.log('done!')
    }

    for (id in modules) {
      module = modules[id]
      if (module.source) {
        steps ++
        utils.writeFile(module.path, module.source, next)
      }
    }
  }, onProgress)
}


command = exports[command] || exports.read
command(options)

