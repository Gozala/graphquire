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
  return id
}
function resolveURI(uri, base) {
  return normalizeURI(resolveID(uri, base))
}
function resolvePluginURI(id) {
  return extractPluginName(id) + '://' + normalizeURI(extractURI(id))
}
function downloadFile(path, uri, callback) {
  uri = url.parse(uri)
  uri.path = uri.pathname
  var get = uri.protocol === 'http:' ? http.get : https.get
  get(uri, function onResponse(response) {
    response.on('data', function onData(buffer) {
      // TODO: We need to make path and write buffer into it.
      callback(null, buffer)
      /*fs.writeFile(path, buffer, function onWrite(error) {
        callback(error, buffer)
      })*/
    })
    response.on('error', callback)
  }).on('error', callback)
}
function getSource(program, module, callback) {
  var filename = path.join(path.dirname(program.path), module.path)
  fs.stat(filename, function onStat(error) {
    if (error) downloadFile(filename, module.uri, callback)
    else fs.readFile(filename, callback)
  })
}

function resolveRequirements(program, requirer, callback) {
  getSource(program, requirer, function(error, source) {
    if (error) return callback(error)

    // Searching for dependencies.
    var dependencies = extractDependencies(source)

    // Dependency resolution tracker that will call a callback once all the
    // dependencies are resolved.
    function next(error) {
      if (error) return callback(error)
      if (Object.keys(requirer.requirements).length === dependencies.length)
        callback(null, program)
    }

    next()

    dependencies.forEach(function onDependency(dependencyID) {
      var id, uri, module;
      module = {}
      id = module.id = resolveID(dependencyID, requirer.id)
      module.path = isPluginURI(id) ?
                    normalizeURI(path.join(program.cacheURI, id)) :
                    resolveURI(id, requirer.path)

      if (isPluginURI(id))
        module.uri = resolvePluginURI(id)

      module.requirements = {}

      requirer.requirements[dependencyID] = id
      program.modules[id] = module

      resolveRequirements(program, module, next)
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

function getGraph(filename, callback) {
  getMetadata(filename, function onMetadata(error, metadata) {
    if (error) return callback(error)

    metadata.cacheURI = './node_modules'
    metadata.path = filename
    metadata.modules = {}
    resolveRequirements(metadata, (metadata.modules[metadata.name] = {
      id: metadata.name,
      path: normalizeURI(metadata.main || "./index.js", filename),
      requirements: {}
    }), callback)
  })
}
exports.getGraph = getGraph
