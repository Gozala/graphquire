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
  var options = optionsFor('pckg-cached')
  getGraph(options, function onGraph(error, graph) {
    assert.deepEqual(graph.metadata, { "name": "pckg1" }, "metadat is correct")
    assert.deepEqual(graph.modules, {
      "./index.js": {
        "id": "./index.js",
        "requirements": {
          "http!foo.org/a": "http!foo.org/a.js"
        }
      },
      "http!foo.org/a.js": {
        "id": "http!foo.org/a.js",
        "requirements": {
          "./nested/b": "http!foo.org/nested/b.js"
        }
      },
      "http!foo.org/nested/b.js": {
        "id": "http!foo.org/nested/b.js",
        "requirements": {
          "http!bar.org/c": "http!bar.org/c.js"
        }
      },
      "http!bar.org/c.js": {
        "id": "http!bar.org/c.js",
      }
    }, 'modules linked correctly')
    done()
  })
}

if (module == require.main)
  require("test").run(exports)
