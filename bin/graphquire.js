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

exports.read = exports['-r'] = exports['--read'] = function read(options) {
  graphquire.getGraph(options, function(error, graph) {
    if (error) console.trace(error)
    else console.log(JSON.stringify(graph, '', '  '))
  })
}

exports.write = exports['-w'] = exports['--write'] = function write(options) {
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
  })
}


command = exports[command] || exports.read
command({ location: location, cachePath: './node_modules' })

