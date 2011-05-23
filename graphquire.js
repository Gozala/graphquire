/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true */

'use strict';

var path = require('path')
var fs = require('fs')

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


function resolveRequirements(module, callback, program) {
  program = program || module
  fs.readFile(module.uri, function(error, source) {
    if (error) return callback(error)

    // Searching for dependencies.
    var dependencies = extractDependencies(source)

    // Dependency resolution tracker that will call a callback once all the
    // dependencies are resolved.
    function next(error) {
      if (error) return callback(error)
      if (Object.keys(module.requirements).length === dependencies.length)
        callback(null, program)
    }

    next()

    dependencies.forEach(function onDependency(dependencyID) {
      var id = resolveID(dependencyID, module.id)
      var dependency = {
        id: id,
        uri: isPluginURI(id) ? normalizeURI(path.join(program.cacheURI, id))
                             : resolveURI(id, module.uri),
        requirements: {}
      }
      module.requirements[dependencyID] = dependency.id
      program.dependencies[dependency.id] = dependency
      resolveRequirements(dependency, next, program)
    })
  })
}
exports.resolveRequirements = resolveRequirements

function getMetadata(uri, callback) {
  fs.readFile(uri, function onRead(error, data) {
    if (error) return callback(error)
    try {
      callback(null, JSON.parse(data))
    } catch (exception) {
      callback(exception)
    }
  })
}
exports.getMetadata = getMetadata

function getGraph(uri, callback) {
  getMetadata(uri, function onMetadata(error, metadata) {
    if (error) return callback(error)

    resolveRequirements({
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      uri: normalizeURI(metadata.main || "./index.js", uri),
      cacheURI: path.join(path.dirname(uri), 'node_modules'),
      requirements: {},
      dependencies: {}
    }, callback)
  })
}
exports.getGraph = getGraph
