/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true */

'use strict';

var fs = require("fs")
var path = require("path")

function isAlreadyExistsError(error) {
  return error && error.code === 'EEXIST'
}
exports.isAlreadyExistsError = isAlreadyExistsError

function isNotDirertoryError(error) {
  return error && error.code === 'ENOTDIR'
}
exports.isNotDirertoryError = isNotDirertoryError

function isNotEmptyError(error) {
  return error && error.code === 'ENOTEMPTY'
}
exports.isNotEmptyError = isNotEmptyError

function isNotExistsError(error) {
  return error && error.code === 'ENOENT'
}
exports.isNotExistsError = isNotExistsError

function makeTree(location, mode, callback) {

  if (!callback) {
    callback = mode
    mode = '0777'
  }

  fs.mkdir(location, mode, function onMake(error) {
    if (!error) callback(null)
    // TODO: Call callback with error if it's a file and not a directory.
    else if (isAlreadyExistsError(error)) callback(null)
    else makeTree(path.dirname(location), mode,
                  makeTree.bind(null, location, mode, callback))
  })
}
exports.makeTree = makeTree

function writeFile(location, source, callback) {
  makeTree(path.dirname(location), function onTree(error) {
    if (error) callback(error)
    else fs.writeFile(location, source, callback)
  })
}
exports.writeFile = writeFile

function True() { return true }
function Next(steps, callback) {
  if (steps === 0) return callback(null)
  return function next(error) { if (error || 0 === --steps) callback(error) }
}

function reduceTree(isReduced, callback, entry) {
  fs.readdir(entry, function onEntries(isReduced, callback, error, entries) {
    // If entry does not exists and it should be reduced then we are done.
    if (isNotExistsError(error))
      return callback(null)
    // If entry is not a directory but we should reduce it we remove a file,
    // if we don't reduce it then we just cal callback
    if (isNotDirertoryError(error))
      return isReduced(entry) ? fs.unlink(entry, callback) : callback(null)
    // If there is any other error we call callback
    if (error) return callback(error)

    // Resolve paths to the base entry.
    var paths = entries.map(path.join.bind(null, entry))

    // We create a callback that we will call on each entry remove / skip.
    // Once all steps are done passed callback will be called, which removes
    // base entry if it should be reduced or keeps otherwise. Finally it will
    // call a main callback.
    var next = Next(paths.length, function onReduce(error) {
      // If there is no error and we need to reduce entry just remove it (also
      // we know it's directory since we got this far).
      if (!error && isReduced(entry)) fs.rmdir(entry, callback)
      // We call callback otherwise.
      else callback(error)
    })
    // We will reduce each entry further by calling `reduceTree` on each.
    paths.forEach(reduceTree.bind(null, isReduced, next))
  }.bind(null, isReduced, callback))
}

exports.reduceTree = function(path, callback, isReduced) {
  return reduceTree(isReduced || True, callback, path)
}
