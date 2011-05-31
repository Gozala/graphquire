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

function isPackageLocation(uri) { return path.basename(uri) === "package.json" }
function isURI(uri) {
  return 0 === uri.indexOf('http:') || 0 === uri.indexOf('https:')
}
function normalizePackageLocation(uri) {
  return isPackageLocation(uri) ? uri :
         uri + (uri[uri.length - 1] === "/" ? "" : "/") + "package.json"
}
function isPluginURI(uri) { return uri && ~uri.indexOf('!') }
function isRelativeURI(id) { return id && id.charAt(0) === '.' }
function normalizeURI(uri) { return path.extname(uri) ? uri : uri + '.js' }
function extractURI(uri) {
  var index = uri.indexOf('!')
  return ~index ? uri.substr(++index) : uri
}
function extractPluginName(id) {
  var index = id.indexOf('!')
  return index > 0 ? id.substr(0, index) : ''
}
function isAbsolute(uri) { return uri && uri.charAt(0) !== '.' }
function resolve(uri, base) {
  var path, paths, last
  if (isAbsolute(uri)) return uri
  paths = uri.split('/')
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
function resolveID(id, base) {
  if (isPluginURI(id))
    id = extractPluginName(id) + '!' + resolve(extractURI(id), base)
  else
    id = resolve(id, base)
  return normalizeURI(id)
}
function resolveURI(uri, base) {
  return normalizeURI(resolveID(uri, base))
}
function resolvePluginURI(id) {
  return extractPluginName(id) + '://' + normalizeURI(extractURI(id))
}

function readURL(uri, callback) {
  var options = url.parse(uri)
  options.path = options.pathname
  options.followRedirect = true
  options.maxRedirects = 2
  var get = options.protocol === 'http:' ? http.get : https.get
  get(options, function onResponse(response) {
    response.on('error', callback)
    response.on('data', function onData(buffer) {
      callback(null, buffer)
    })
  }).on('error', callback)
}

function fetchSource(module, callback) {
  readURL(module.uri, function onRead(error, data) {
    if (error) callback(error)
    else callback(error, module.source = data)
  })
}

function getSource(metadata, module, onComplete, onProgress) {
  if (!isPluginURI(module.id) && !isRelativeURI(module.id)) {
    module.isNative = true
    delete module.path
    delete module.uri
    return onComplete(null, module)
  }
  var location = path.join(path.dirname(metadata.location), module.path)
  if (onProgress) onProgress(READ_FILE, location)
  fs.readFile(location, function onRead(error, buffer) {
    if (!error || error.code !== 'ENOENT') return onComplete(error, buffer)
    if (onProgress) onProgress(FETCH_URL, module.uri)
    fetchSource(module, onComplete)
  })
}

function getDependency(metadata, requirer, next, onProgress, dependencyID) {
  var id, module;
  id = resolveID(dependencyID, requirer.id)
  id = requirer.requirements[dependencyID] = id

  // If module is already loaded or is being fetched we just go next.
  if ((module = metadata.manifest[id]))
    return next(null, metadata, module, next)

  // Otherwise we create module and start resolving it's dependencies
  module = metadata.manifest[id] = { id: id }
  module.path = isPluginURI(id) ?
                path.join(metadata.cachePath, id) : id

  if (isPluginURI(id))
    module.uri = resolvePluginURI(id)
  else if (requirer.uri)
    module.uri = resolveURI(dependencyID, requirer.uri)

  resolveRequirements(metadata, module, next, onProgress)
}

function Next(total, onComplete, onProgress) {
  var current = 0
  return function next(error, metadata, module) {
    if (error) return onComplete(error)
    if (++ current === total)
      onComplete(error, metadata, module)
  }
}

function resolveRequirements(metadata, module, onComplete, onProgress) {
  if (onProgress) onProgress(GET_MODULE, module)
  getSource(metadata, module, function onSource(error, source) {
    var dependencies, resolved = 0

    if (error) return onComplete(error)
    if (onProgress) onProgress(GOT_MODULE, module)
    // Extracting module dependencies by analyzing it's source.
    dependencies = extractDependencies(source)

    // If module has no dependencies we call callback and return immediately.
    if (!dependencies.length)
      return onComplete(error, metadata, module)

    // If we got this far we know module has dependencies, so we create it's
    // requirements map.
    module.requirements = {}

    // Creating dependency tracker which we will call after each dependency is
    // resolved. Tracker will call `callback` once all the dependencies of this
    // module will be resolved.
    var next = Next(dependencies.length, onComplete)
    dependencies.forEach(getDependency.bind(null, metadata, module, next, onProgress))
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
  if (onProgress) onProgress(GET_METADATA, location)
  getMetadata(location, function onMetadata(error, content) {
    var metadata
    if (error) return onComplete(error)

    metadata = JSON.parse(String(content))
    metadata.cachePath = options.cachePath || '.'
    metadata.location = location
    metadata.manifest = {}

    var pckg = metadata.manifest['./package.json'] = {}
    if (isURI(location)) pckg.uri = location, pckg.source = content

    if (onProgress) onProgress(GOT_METADATA, metadata)

    var main = metadata.manifest[metadata.main || "./index.js"] = { }
    if (isURI(location)) {
      main.uri = url.resolve(location, metadata.main || "./index.js")
      main.id = metadata.main || "./index.js"
    } else {
      main.id = metadata.main || "./index.js"
      main.path = normalizeURI(metadata.main || "./index.js")
    }

    resolveRequirements(metadata, main, onComplete, onProgress)
  })
}
exports.getGraph = getGraph
