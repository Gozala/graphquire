#!/usr/bin/env node

/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false globalstrict: true */
/*global define: true */

'use strict';

var graphquire = require('../graphquire')
var utils = require('../utils/fs')
var path = require('path')

var params = process.argv.slice(2)

function getLocation() {
  return params.filter(function onEach(param) {
    return param.charAt(0) !== '-'
  })[0] || process.cwd()
}

function isWriting() {
  return params.some(function onEach(param) {
    return param === '-w' || param === '--write'
  })
}
function isCleaning() {
  return params.some(function onEach(param) {
    return param === '-c' || param === '--clean'
  })
}
function isVerbose() {
  return params.some(function onEach(param) {
    return param === '-v' || param === '--verbose'
  })
}

var options = {
  cachePath: './node_modules',
  location: getLocation(),
  isVerbose: isVerbose(),
  isCleaning: isCleaning(),
  isWriting: isWriting()
}

if (options.isVerbose) {
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

function write(graph, callback) {
  var id, module, modules = graph.modules, steps = 1
  function next(error) {
    if (error) callback(error)
    if (--steps === 0) callback(null)
  }

  for (id in modules) {
    module = modules[id]
    if (module.source) {
      steps ++
      utils.writeFile(module.path, module.source, next)
    }
  }

  next()
}

function hasPath(modules, id) { return !!modules[id].path }
function getPath(modules, id) { return modules[id].path }

function clean(graph, callback) {
  var modules = graph.modules
  var root = path.dirname(graph.location)
  var http = path.join(root, graph.cachePath, 'http!')
  var https = path.join(root, graph.cachePath, 'https!')
  var paths = Object.keys(modules).filter(hasPath.bind(null, modules))
                                  .map(getPath.bind(null, modules))
                                  .map(path.join.bind(path, root))
  var location = path.join(root, graph.cachePath)
  utils.reduceTree(location, callback, function isReduced(entry) {
    var isNative = !(~entry.indexOf(http) || ~entry.indexOf(https))
    var isRequired = !paths.every(function(path) {
      return !~path.indexOf(entry)
    })
    return !isNative && !isRequired
  })
}

graphquire.getGraph(options, function onGraph(error, graph) {
  if (error) return console.trace(error)
  if (!options.isWriting) return console.log(JSON.stringify(graph, '', '   '))
  if (options.isVerbose) console.log(JSON.stringify(graph, '', '   '))
  write(graph, function onWrite(error) {
    if (error) return console.trace(error)
    if (!options.isCleaning) return console.log('Dependencies installed!')
    clean(graph, function onClean(error) {
      if (error) console.trace(error)
      else console.log("Dependencies installed!")
    })
  })
}, options.onProgress)
