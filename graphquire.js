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
function resolve(id, base) {
  return isRelativeURI(id) ? path.join(path.dirname(base), id) : id
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
    else callback(error, module.source = String(data))
  })
}

function getSource(metadata, module, callback) {
  if (module.path && !isPluginURI(module.id) && !isRelativeURI(module.path)) {
    module.isNative = true
    delete module.path
    delete module.uri
    return callback(null, module)
  }
  var location = path.join(path.dirname(metadata.location), module.path)
  fs.stat(location, function onStat(error) {
    if (error) fetchSource(module, callback)
    else fs.readFile(location, callback)
  })
}

function onDependency(metadata, requirer, next, dependencyID) {
  var id, module;
  id = resolveID(dependencyID, requirer.id)
  id = requirer.requirements[dependencyID] = id

  // If module is already loaded or is being fetched we just go next.
  if (id in metadata.modules)
    return next(metadata, metadata.module[id], next)

  // Otherwise we create module and start resolving it's dependencies
  module = metadata.modules[id] = { id: id }
  module.path = isPluginURI(id) ?
                normalizeURI(path.join(metadata.cachePath, id)) :
                resolveURI(id, requirer.path)

  if (isPluginURI(id))
    module.uri = resolvePluginURI(id)

  resolveRequirements(metadata, module, next)
}

function Next(total, callback) {
  var current = 0
  return function next(error) {
    if (error) return callback(error)
    if (++ current === total)
      callback.apply(this, arguments)
  }
}

function resolveRequirements(metadata, requirer, callback) {
  getSource(metadata, requirer, function(error, source) {
    var dependencies, resolved = 0

    if (error) return callback(error)

    // Extracting module dependencies by analyzing it's source.
    dependencies = extractDependencies(source)

    // If module has no dependencies we call callback and return immediately.
    if (!dependencies.length)
      return callback(null, metadata)

    // If we got this far we know module has dependencies, so we create it's
    // requirements map.
    requirer.requirements = {}

    // Creating dependency tracker which we will call after each dependency is
    // resolved. Tracker will call `callback` once all the dependencies of this
    // module will be resolved.
    var next = Next(dependencies.length, callback)
    dependencies.forEach(onDependency.bind(null, metadata, requirer, next))
  })
}
exports.resolveRequirements = resolveRequirements

function getMetadata(location, callback) {
  var read = isURI(location) ? readURL : fs.readFile
  read(location, function onRead(error, data) {
    if (error) return callback(error)
    try {
      callback(null, JSON.parse(String(data)))
    } catch (exception) {
      callback(exception)
    }
  })
}
exports.getMetadata = getMetadata

function getGraph(options, callback) {
  var location = normalizePackageLocation(options.location)
  getMetadata(location, function onMetadata(error, metadata) {
    if (error) return callback(error)

    metadata.cachePath = options.cachePath || '.'
    metadata.location = location
    metadata.modules = {}

    var main = metadata.modules[metadata.name] = { }
    if (isURI(location)) {
      main.uri = url.resolve(location, metadata.main || "./index.js")
      main.id = main.uri.replace("://", "!")
    } else {
      main.id = metadata.name
      main.path = normalizeURI(metadata.main || "./index.js")
    }
    resolveRequirements(metadata, main, callback)
  })
}
exports.getGraph = getGraph
