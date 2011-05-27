/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true */

'use strict';

var fs = require("fs")
var path = require("path")

function makeTree(location, mode, callback) {

  if (!callback) {
    callback = mode
    mode = '0777'
  }

  fs.mkdir(location, mode, function onMake(error) {
    if (!error) callback(null)
    // TODO: Call callback with error if it's a file and not a directory.
    else if (error.code === 'EEXIST') callback(null)
    else makeTree(path.dirname(location), mode,
                  makeTree.bind(null, location, mode, callback))
  })
}
exports.makeTree = makeTree

function removeEntries(location, callback) {
  fs.readdir(location, function onList(error, entries) {
    var steps = entries.length
    if (error) return callback(error)
    function next(error) {
      if (error) return callback(error)
      if (entries.length === ++steps) callback(null)
    }

    while(--steps >= 0) removeTree(path.join(location, entries[steps]), next)

    next()
  })
}

function removeTree(location, callback) {
  fs.rmdir(location, function onRemove(error) {
    // If delete succeeded or directory did not existed we call callback.
    if (!error || error.code === 'ENOENT') callback(null)
    // If it's not a directory then use unlink instead.
    else if (error.code === 'ENOTDIR') fs.unlink(location, callback)
    // If directory is not empty we should delete each entry
    else if (error.code === 'ENOTEMPTY')
      removeEntries(location, removeTree.bind(null, location, callback))
    else callback(error)
  })
}
exports.removeTree = removeTree

function writeFile(location, source, callback) {
  makeTree(path.dirname(location), function onTree(error) {
    if (error) callback(error)
    else fs.writeFile(location, source, callback)
  })
}
exports.writeFile = writeFile
