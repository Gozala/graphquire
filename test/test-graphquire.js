/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true */

"use strict";

var path = require('path')
var getGraph = require('../graphquire').getGraph

function pathFor(name) {
  return path.join(module.filename, '../fixtures/' + name + '/package.json')
}

exports['test basic'] = function(assert, done) {
  var filename = pathFor('pckg1')
  getGraph(filename, function onGraph(error, graph) {
    assert.deepEqual(graph, {
      "name": "pckg1",
      "cacheURI": "./node_modules",
      "path": filename,
      "modules": {
        "pckg1": {
          "id": "pckg1",
          "path": "./index.js",
          "requirements": {
            "http!foo.org/a": "http!foo.org/a"
          }
        },
        "http!foo.org/a": {
          "id": "http!foo.org/a",
          "path": "node_modules/http!foo.org/a.js",
          "uri": "http://foo.org/a.js",
          "requirements": {
            "./nested/b": "http!foo.org/nested/b"
          }
        },
        "http!foo.org/nested/b": {
          "id": "http!foo.org/nested/b",
          "path": "node_modules/http!foo.org/nested/b.js",
          "uri": "http://foo.org/nested/b.js",
          "requirements": {
            "http!bar.org/c": "http!bar.org/c"
          }
        },
        "http!bar.org/c": {
          "id": "http!bar.org/c",
          "path": "node_modules/http!bar.org/c.js",
          "uri": "http://bar.org/c.js",
          "requirements": {}
        }
      }
    }, 'correct graph is generated')
    done()
  })
}

if (module == require.main)
  require("test").run(exports)
