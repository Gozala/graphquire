/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true */

"use strict";

var path = require('path')
var getGraph = require('../graphquire').getGraph

function optionsFor(name, cachePath) {
  return {
    location: path.join(module.filename, '../fixtures/' + name),
    cachePath: cachePath || "./node_modules"
  }
}

exports['test basic'] = function(assert, done) {
  var options = optionsFor('pckg1')
  getGraph(options, function onGraph(error, graph) {
    assert.deepEqual(graph, {
      "name": "pckg1",
      "cachePath": "./node_modules",
      "location": options.location + '/package.json',
      "modules": {
        "pckg1": {
          "id": "pckg1",
          "path": "./index.js",
          "requirements": {
            "http!foo.org/a": "http!foo.org/a.js"
          }
        },
        "http!foo.org/a.js": {
          "id": "http!foo.org/a.js",
          "path": "node_modules/http!foo.org/a.js",
          "uri": "http://foo.org/a.js",
          "requirements": {
            "./nested/b": "http!foo.org/nested/b.js"
          }
        },
        "http!foo.org/nested/b.js": {
          "id": "http!foo.org/nested/b.js",
          "path": "node_modules/http!foo.org/nested/b.js",
          "uri": "http://foo.org/nested/b.js",
          "requirements": {
            "http!bar.org/c": "http!bar.org/c.js"
          }
        },
        "http!bar.org/c.js": {
          "id": "http!bar.org/c.js",
          "path": "node_modules/http!bar.org/c.js",
          "uri": "http://bar.org/c.js",
        }
      }
    }, 'correct graph is generated')
    done()
  })
}

if (module == require.main)
  require("test").run(exports)
