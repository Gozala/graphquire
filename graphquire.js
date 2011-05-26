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
  return isPackageLocation(uri) ? uri : path.join(uri, "package.json")
}
function isPluginURI(uri) { return ~uri.indexOf('!') }
function isRelativeURI(id) { return id.charAt(0) === '.' }
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
function readURL(module, callback) {
  var options = url.parse(module.uri)
  options.path = options.pathname
  options.followRedirect = true
  options.maxRedirects = 2
  var get = module.uri.protocol === 'http:' ? http.get : https.get
  get(options, function onResponse(response) {
    response.on('error', callback)
    response.on('data', function onData(buffer) {
      callback(null, module.source = String(buffer))
    })
  }).on('error', callback)
}
function getSource(metadata, module, callback) {
  if (!isPluginURI(module.id) && !isRelativeURI(module.path)) {
    module.isNative = true
    delete module.path
    delete module.uri
    return callback(null, module)
  }
  var location = path.join(path.dirname(metadata.location), module.path)
  fs.stat(location, function onStat(error) {
    if (error) readURL(module, callback)
    else fs.readFile(location, callback)
  })
}

function resolveRequirements(metadata, requirer, callback) {
  getSource(metadata, requirer, function(error, source) {
    if (error) return callback(error)

    // Searching for dependencies.
    var dependencies = extractDependencies(source)
    if (dependencies.length)
      requirer.requirements = {}

    // Dependency resolution tracker that will call a callback once all the
    // dependencies are resolved.
    function next(error) {
      if (error) return callback(error)
      if (!requirer.requirements ||
          Object.keys(requirer.requirements).length === dependencies.length)
        callback(null, metadata)
    }

    next()

    dependencies.forEach(function onDependency(dependencyID) {
      var id, uri, module;
      module = {}
      id = module.id = resolveID(dependencyID, requirer.id)
      module.path = isPluginURI(id) ?
                    normalizeURI(path.join(metadata.cachePath, id)) :
                    resolveURI(id, requirer.path)

      if (isPluginURI(id))
        module.uri = resolvePluginURI(id)

      requirer.requirements[dependencyID] = id
      metadata.modules[id] = module

      resolveRequirements(metadata, module, next)
    })
  })
}
exports.resolveRequirements = resolveRequirements

function getMetadata(path, callback) {
  fs.readFile(path, function onRead(error, data) {
    if (error) return callback(error)
    try {
      callback(null, JSON.parse(data))
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
    resolveRequirements(metadata, (metadata.modules[metadata.name] = {
      id: metadata.name,
      path: normalizeURI(metadata.main || "./index.js", metadata.location),
    }), callback)
  })
}
exports.getGraph = getGraph
