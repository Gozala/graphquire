# graphquire #

Module graph builder. This tool may be used to build module dependency graph
starting form package's main module. This prototype recognizes two types of
module ids:

  1. Relative:
     `require('./foo/bar')`
     `require('./bla.js')`
     `require('../baz')`

  2. Absolute:
     `require('http!foo.org/bar')`
     `require('https!bla.org/baz.js)`

Notice `http!` prefix in absolute id ? That's a way to define remote
dependencies. This makes packages obsolete, defining dependencies in the package
saves few keystrokes but is pretty is unwebby as it brings a lot of complexity
by introducing nested dependencies, encouraging code duplication instead of
sharing. Of course we can employ some tools to handle this complexity, but
maybe absolute URIs are not bad ?! Also public module registry would make this
a non problem: `require('http!jsm.org/underscore')`.

## Goals ##

At the moment `graphquire` is capable of building a module dependency graph by
reading modules required by relative or absolute id. Also this can be converted
to npm's post-install script, in order to fetch and write all dependencies into
`node_modules` folder so that, such packages will work fine in nodejs. There
is experimental browser based module loader
[teleport](https://github.com/Gozala/teleport/blob/experimental/npm-1.x.x/teleport.js)
that can load modules from both relative and absolute ids. In addition there is
a plan to support addon-sdk formally jetpack in some manner.


## Install ##

    npm install graphquire

## Usage ##

Run `graphquire` command on the `package.json` file of javascript package.

    graphquire test/fixtures/pckg1/package.json

This will write output like following:

    {
      "name": "pckg1",
      "cachePath": "./node_modules",
      "path": "test/fixtures/pckg1/package.json",
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
          "requirements": {}
        }
      }
    }

Please note that in this case all the modules with absolute ids were already
cached locally. Go ahead and try the same with
[another package](./test/fixtures/pckg2/package.json) and you'll see that
non-cached absolute modules still will be in graph and they will even contain
module source.
