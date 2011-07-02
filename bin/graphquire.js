#!/usr/bin/env node

/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: false latedef: false globalstrict: true */
/*global define: true */

'use strict';

var graphquire = require('../graphquire')
var deployment = require('../utils/deployment')

var params = process.argv.slice(2)
var onProgress

function getLocation() {
  return params.filter(function onEach(param) {
    return param.charAt(0) !== '-'
  })[0] || process.cwd()
}

function cachePath() {
  var index = params.indexOf('--cache-path')
  return ~index ? params[++index] : './node_modules'
}

function isEscape() {
  return params.some(function onEach(param) {
    return param === '-e' || param === '--escape'
  })
}

function isWriting() {
  return params.some(function onEach(param) {
    return param === '-w' || param === '--write'
  })
}
function isCleaning() {
  return params.some(function onEach(param) {
    return param === '-c' || param === '--clean' || param === '--clear'
  })
}
function isVerbose() {
  return params.some(function onEach(param) {
    return param === '-v' || param === '--verbose'
  })
}
function isNoSource() {
  return params.some(function onEach(param) {
    return param === '--no-source'
  })
}

if (isVerbose()) {
  onProgress = function onProgress(state, data) {
    switch (state) {
      case graphquire.GET_METADATA:
        return console.log("Reading package descriptor from: ", data)
      case graphquire.GOT_METADATA:
        console.log("Package desriptor was parsed:")
        return console.log(data)
      case graphquire.GET_MODULE:
        return console.log("Trying to find module: ", data.id)
      case graphquire.READ_FILE:
        return console.log("Reading a module form: ", data)
      case graphquire.FETCH_URL:
        return console.log("Reading a module from URL: ", data)
      case graphquire.GOT_MODULE:
        return console.log("Found module:", data.id)
      case deployment.START_CLEANUP:
        return console.log("Cleaning up legacy dependencies")
      case deployment.DELETE_PATH:
        return console.log("Removing file: ", data)
      case deployment.WRITE_MODULE:
        return console.log("Installing module: ", data.id)
      case deployment.WROTE_MODULE:
        return console.log("Module installed: ", data.id)
    }
  }
}

function failure(error) {
  console.error('Error: ' + error)
  console.trace(error)
}

var options = {
  cachePath: cachePath(),
  location: getLocation(),
  includeSource: !isNoSource(),
  escape: isEscape()
}

graphquire.getGraph(options, function onGraph(error, graph) {
  if (error) return failure(error)
  if (!isWriting()) {
    var id, source, modules = graph.modules
    for (id in modules) {
      if ((source = modules[id].source)) modules[id].source = String(source)
    }
    return console.log(JSON.stringify(graph, '', '   '))
  }
  deployment.write(graph, function onWrite(error) {
    if (error) return failure(error)
    if (!isCleaning()) return console.log('Modules installed successfully!')
    deployment.clean(graph, function onClean(error) {
      if (error) return failure(error)
      console.log('Modules installed & cleaned up successfully!')
    }, onProgress)
  }, onProgress)
}, onProgress)
