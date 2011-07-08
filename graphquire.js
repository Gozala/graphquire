/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true */

'use strict';

var path = require('path')
var fs = require('fs')
var http = require('http')
var https = require('https')
var url = require('url')

var COMMENT_PATTERN = /(\/\*[\s\S]*?\*\/)|((^|\n)[^('|"|\n)]*\/\/[^\n]*)/g
var REQUIRE_PATTERN = /require\s*\(['"]([\w\W]*?)['"]\s*\)/g

var GET_METADATA = exports.GET_METADATA = 0
var GOT_METADATA = exports.GOT_MODULE = 1
var GET_MODULE = exports.GET_MODULE = 2
var READ_FILE = exports.READ_FILE = 3
var FETCH_URL = exports.FETCH_URL = 4
var GOT_MODULE = exports.GOT_MODULE = 5

function extractDependencies(source) {
  var dependency, dependencies = []
  // Removing comments to avoid capturing commented require statements.
  source = String(source).replace(COMMENT_PATTERN, '')
  // Push each found dependency into array.
  while ((dependency = REQUIRE_PATTERN.exec(source)))
    dependencies.push(dependency[1])

  return dependencies
}

function isHttps(id) {
  return id.charAt(0) === '!'
}
function isPackageLocation(uri) { return path.basename(uri) === "package.json" }
function normalizePackageLocation(uri) {
  return isPackageLocation(uri) ? uri :
         uri + (uri[uri.length - 1] === "/" ? "" : "/") + "package.json"
}
function isRelative(id) { return id && id.charAt(0) === '.' }
function isURI(uri) { return ~uri.indexOf('://') }
function toURL(id) {
  return isURI(id) ? id : isHttps(id) ? 'https://' + id.substr(1) : 'http://' + id
}
function isSupported(uri) {
  return !isRelative(uri) && ~uri.indexOf('/') &&
         ~uri.slice(0, uri.indexOf('/')).indexOf('.')
}
exports.isSupported = isSupported
function normalize(id) { return path.extname(id) ? id : id + '.js' }
function resolveID(id, base) {
  var path, paths, last
  if (!isRelative(id)) return id
  paths = id.split('/')
  base = base ? base.split('/') : [ '.' ]
  if (base.length > 1) base.pop()
  while ((path = paths.shift())) {
    if (path === '..') {
      if (base.length && base[base.length - 1] !== '..') {
        if (base.pop() === '.') base.push(path)
      } else base.push(path)
    } else if (path !== '.') {
      base.push(path)
    }
  }
  if (base[base.length - 1].substr(-1) === '.') base.push('')
  return base.join('/')
}
function resolve(id, base) {
  return isSupported(id) ? id : resolveID(id, base)
}

function readURL(uri, callback) {
  var options = url.parse(uri)
  options.path = options.pathname
  options.followRedirect = true
  options.maxRedirects = 2
  var get = options.protocol === 'http:' ? http.get : https.get
  var buffer = ''
  get(options, function onResponse(response) {
    response.on('error', callback)
    response.on('data', function onData(chunk) { buffer += chunk })
    response.on('end', function onEnd() {
      callback(null, buffer, true)
    })
  }).on('error', callback)
}
exports.readURL = readURL

function getSource(graph, module, onComplete, onProgress) {
  var path = graph.resolvePath(module.id)
  var uri = graph.resolveURI(module.id)
  if (path) {
    if (onProgress) onProgress(READ_FILE, module.path)
    fs.readFile(path, function onRead(error, buffer) {
      if (!error || error.code !== 'ENOENT' || !uri)
        return onComplete(error, buffer)
      if (onProgress) onProgress(FETCH_URL, uri)
      readURL(toURL(uri), onComplete)
    })
  } else {
    module.isNative = true
    return onComplete(null, module)
  }
}

function getDependency(graph, requirer, next, onProgress, dependencyID) {
  var id, module;
  id = resolve(dependencyID, requirer.id)
  id = requirer.requirements[dependencyID] = id

  // If module is already loaded or is being fetched we just go next.
  if ((module = graph.modules[id]))
    return next(null, graph, module, next)

  // Otherwise we create module and start resolving it's dependencies
  module = graph.modules[id] = { id: id }

  resolveRequirements(graph, module, next, onProgress)
}

function Next(total, onComplete, onProgress) {
  var current = 0
  return function next(error, graph, module) {
    if (error) return onComplete(error)
    if (++ current === total)
      onComplete(error, graph, module)
  }
}

function resolveRequirements(graph, module, onComplete, onProgress) {
  if (onProgress) onProgress(GET_MODULE, module)
  getSource(graph, module, function onSource(error, source, isRemote) {
    var dependencies, resolved = 0

    if (error) return onComplete(error)
    if (onProgress) onProgress(GOT_MODULE, module)
    if (isRemote && graph.includesSource) module.source = source
    // Extracting module dependencies by analyzing it's source.
    dependencies = extractDependencies(source)

    // If module has no dependencies we call callback and return immediately.
    if (!dependencies.length)
      return onComplete(error, graph, module)

    // If we got this far we know module has dependencies, so we create it's
    // requirements map.
    module.requirements = {}

    // Creating dependency tracker which we will call after each dependency is
    // resolved. Tracker will call `callback` once all the dependencies of this
    // module will be resolved.
    var next = Next(dependencies.length, onComplete)
    dependencies.forEach(getDependency.bind(null, graph, module, next, onProgress))
  }, onProgress)
}
exports.resolveRequirements = resolveRequirements

function getMetadata(location, callback) {
  var read = isURI(location) ? readURL : fs.readFile
  read(location, callback)
}
exports.getMetadata = getMetadata

function getGraph(options, onComplete, onProgress) {
  var location = normalizePackageLocation(options.location)
  var graph = {
    path: isURI(location) ? './' : location,
    uri: isURI(location) ? location : './',
    cachePath: options.cachePath || './',
    includesSource: options.includeSource || false,
    resolvePath: options.resolvePath || function resolvePath(id) {
      var root = path.dirname(graph.path)
      return isSupported(id) ? normalize(path.join(root, graph.cachePath, id))
             : isRelative(id) ? normalize(path.join(root, id)) : null
    },
    resolveURI: options.resolveURI || function resolveURI(id) {
      return isSupported(id) ? normalize(id)
             : isRelative(id) ? normalize(resolve(id, graph.uri)) : null
    }
  }
  if (onProgress) onProgress(GET_METADATA, location)
  getMetadata(location, function onMetadata(error, content) {
    if (error) return onComplete(error)

    graph.metadata = JSON.parse(String(content))
    graph.modules = {}

    if (onProgress) onProgress(GOT_METADATA, graph.metadata)

    var main = { id: graph.metadata.main || "./index.js" }
    graph.modules[main.id] = main

    resolveRequirements(graph, main, onComplete, onProgress)
  })
}
exports.getGraph = getGraph
