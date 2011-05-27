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
      "location": "/Users/gozala/Projects/graphquire/test/fixtures/pckg1/package.json",
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
          "uri": "http://bar.org/c.js"
        }
      }
    }


Please note that in this case all the modules with absolute ids were already
cached locally. Go ahead and try the same with
[another package](./test/fixtures/pckg2/package.json) and you'll see that
non-cached absolute modules still will be in graph and they will even contain
module source.


In addition you can create graphs for remote packages:

    graphquire https://github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/package.json

And you'll get something like following but with an actual source code of the
module under the `source` attributes:


    {
      "name": "pckg2",
      "version": "0.0.1",
      "description": "test package with remote dependencies",
      "cachePath": "./node_modules",
      "location": "https://github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/package.json",
      "modules": {
        "pckg2": {
          "uri": "https://github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/index.js",
          "id": "https!github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/index.js",
          "source": "...."
          "requirements": {
            "https!github.com/Gozala/models/raw/master/lib/models.js": "https!github.com/Gozala/models/raw/master/lib/models.js"
          }
        },
        "https!github.com/Gozala/models/raw/master/lib/models.js": {
          "id": "https!github.com/Gozala/models/raw/master/lib/models.js",
          "path": "node_modules/https!github.com/Gozala/models/raw/master/lib/models.js",
          "uri": "https://github.com/Gozala/models/raw/master/lib/models.js",
          "source": "....."
          "requirements": {
            "./events": "https!github.com/Gozala/models/raw/master/lib/events.js"
          }
        },
        "https!github.com/Gozala/models/raw/master/lib/events.js": {
          "id": "https!github.com/Gozala/models/raw/master/lib/events.js",
          "path": "node_modules/https!github.com/Gozala/models/raw/master/lib/events.js",
          "uri": "https://github.com/Gozala/models/raw/master/lib/events.js",
          "source": "....."
          "requirements": {
            "./extendables": "https!github.com/Gozala/models/raw/master/lib/extendables.js"
          }
        },
        "https!github.com/Gozala/models/raw/master/lib/extendables.js": {
          "id": "https!github.com/Gozala/models/raw/master/lib/extendables.js",
          "path": "node_modules/https!github.com/Gozala/models/raw/master/lib/extendables.js",
          "uri": "https://github.com/Gozala/models/raw/master/lib/extendables.js",
          "source": "...."
        }
      }
    }

