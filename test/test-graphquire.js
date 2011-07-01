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

exports['test cached no package dependencies'] = function(assert, done) {
  var options = optionsFor('pckg-cached')
  getGraph(options, function onGraph(error, graph) {
    assert.deepEqual(graph.metadata, { "name": "pckg1" }, "metadat is correct")
    assert.deepEqual(graph.modules, {
      "./index.js": {
        "id": "./index.js",
        "requirements": {
          "http://foo.org/a": "http://foo.org/a.js"
        }
      },
      "http://foo.org/a.js": {
        "id": "http://foo.org/a.js",
        "requirements": {
          "./nested/b": "http://foo.org/nested/b.js"
        }
      },
      "http://foo.org/nested/b.js": {
        "id": "http://foo.org/nested/b.js",
        "requirements": {
          "http://bar.org/c": "http://bar.org/c.js"
        }
      },
      "http://bar.org/c.js": {
        "id": "http://bar.org/c.js",
      }
    }, 'modules linked correctly')
    done()
  })
}

exports['test cached with package dependencies'] = function(assert, done) {
  var options = optionsFor('pckg-npm')
  getGraph(options, function onGraph(error, graph) {
    assert.deepEqual(graph.metadata, { "name": "pckg1" }, "metadat is correct")
    assert.deepEqual(graph.modules, {
      "./index.js": {
         "id": "./index.js",
         "requirements": {
            "http://foo.org/a.js": "http://foo.org/a.js",
            "dependency": "dependency.js"
         }
      },
      "http://foo.org/a.js": {
         "id": "http://foo.org/a.js",
         "requirements": {
            "./nested/b": "http://foo.org/nested/b.js"
         }
      },
      "dependency.js": {
         "id": "dependency.js",
         "isNative": true
      },
      "http://foo.org/nested/b.js": {
         "id": "http://foo.org/nested/b.js",
         "requirements": {
            "http://bar.org/c": "http://bar.org/c.js"
         }
      },
      "http://bar.org/c.js": {
         "id": "http://bar.org/c.js"
      }
    }, 'modules linked correctly')
    done()
  })
}

exports['test package with remote modules (SLOW, requires network)'] = function(assert, done) {
  var options = optionsFor('pckg-uncached')
  getGraph(options, function onGraph(error, graph) {
    assert.deepEqual(graph.metadata, {
      "name": "pckg2",
      "version": "0.0.1",
      "description": "test package with remote dependencies"
    }, "metadata is correct")
    assert.deepEqual(graph.modules, {
      "./index.js": {
         "id": "./index.js",
         "requirements": {
            "https://raw.github.com/Gozala/models/master/models.js": "https://raw.github.com/Gozala/models/master/models.js"
         }
      },
      "https://raw.github.com/Gozala/models/master/models.js": {
         "id": "https://raw.github.com/Gozala/models/master/models.js",
         "requirements": {
            "https!raw.github.com/Gozala/extendables/v0.2.0/extendables.js": "https!raw.github.com/Gozala/extendables/v0.2.0/extendables.js",
            "https!raw.github.com/Gozala/events/v0.2.0/events.js": "https!raw.github.com/Gozala/events/v0.2.0/events.js"
         }
      },
      "https!raw.github.com/Gozala/extendables/v0.2.0/extendables.js": {
         "id": "https!raw.github.com/Gozala/extendables/v0.2.0/extendables.js",
         "isNative": true
      },
      "https!raw.github.com/Gozala/events/v0.2.0/events.js": {
         "id": "https!raw.github.com/Gozala/events/v0.2.0/events.js",
         "isNative": true
      }
    }, 'modules linked correctly')
    done()
  })
}

if (module == require.main)
  require("test").run(exports)
