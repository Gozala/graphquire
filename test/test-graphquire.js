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
          "foo.org/a": "foo.org/a"
        }
      },
      "foo.org/a": {
        "id": "foo.org/a",
        "requirements": {
          "./nested/b": "foo.org/nested/b"
        }
      },
      "foo.org/nested/b": {
        "id": "foo.org/nested/b",
        "requirements": {
          "!bar.org/c": "!bar.org/c"
        }
      },
      "!bar.org/c": {
        "id": "!bar.org/c",
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
            "foo.org/a": "foo.org/a",
            "dependency": "dependency"
         }
      },
      "foo.org/a": {
         "id": "foo.org/a",
         "requirements": {
            "./nested/b": "foo.org/nested/b"
         }
      },
      "dependency": {
         "id": "dependency",
         "isNative": true
      },
      "foo.org/nested/b": {
         "id": "foo.org/nested/b",
         "requirements": {
            "bar.org/c": "bar.org/c"
         }
      },
      "bar.org/c": {
         "id": "bar.org/c"
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
    assert.deepEqual(graph.modules, ({
      "./index.js": {
         "id": "./index.js",
         "requirements": {
            "!raw.github.com/Gozala/models/v0.2.0/models": "!raw.github.com/Gozala/models/v0.2.0/models"
         }
      },
      "!raw.github.com/Gozala/models/v0.2.0/models": {
         "id": "!raw.github.com/Gozala/models/v0.2.0/models",
         "requirements": {
            "!raw.github.com/Gozala/events/v0.4.0/events": "!raw.github.com/Gozala/events/v0.4.0/events"
         }
      },
      "!raw.github.com/Gozala/events/v0.4.0/events": {
         "id": "!raw.github.com/Gozala/events/v0.4.0/events",
         "requirements": {
            "!raw.github.com/Gozala/extendables/v0.2.0/extendables": "!raw.github.com/Gozala/extendables/v0.2.0/extendables"
         }
      },
      "!raw.github.com/Gozala/extendables/v0.2.0/extendables": {
         "id": "!raw.github.com/Gozala/extendables/v0.2.0/extendables"
      }
    }), 'modules linked correctly')
    done()
  })
}

if (module == require.main)
  require("test").run(exports)
