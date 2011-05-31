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


## Install ##

      npm install graphquire

## Usage ##

### NodeJS ##

You can use `graphquire` as npm's install script. This way you can start using
absolute module id's in nodejs today. All you need to do is:

1. Add `graphquire` to your dev-dependencies in `package.json`:

        "devDependencies": {
          "graphquire": ">=0.5.0"
        }

2. Add install script to your `package.json`:

        "scripts": {
          "install": "graphquire --clean --write"
        }

### Browser ###

There is experimental browser based module loader
[teleport](https://github.com/Gozala/teleport/blob/experimental/npm-1.x.x/teleport.js)
that can load modules from both relative and absolute ids. This way packages
that don't depend on engine specific functionality can be shared among browser
nodejs and very soon with jetpack.

### CLI ###

You can use `graphquire` as a command line tool:

1. To analyze dependency graph by running `graphquire` command on the
`package.json` file of javascript package:

        graphquire test/fixtures/pckg1/package.json

        {
           "name": "pckg1",
           "cachePath": "./node_modules",
           "location": "/Users/gozala/Projects/graphquire/test/fixtures/pckg1/package.json",
           "manifest": {
              "./package.json": {},
              "./index.js": {
                 "id": "./index.js",
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


2. You can also analyze graphs on the remote packages (Please note that source
   attributes are replaced by ...):

        graphquire https://github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/package.json

        {
           "name": "pckg2",
           "version": "0.0.1",
           "description": "test package with remote dependencies",
           "cachePath": "./node_modules",
           "location": "https://github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/package.json",
           "manifest": {
              "./package.json": {
                 "uri": "https://github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/package.json",
                 "source": "...."
              },
              "./index.js": {
                 "uri": "https://github.com/Gozala/graphquire/raw/master/test/fixtures/pckg2/index.js",
                 "id": "./index.js",
                 "source": ".....",
                 "requirements": {
                    "https!github.com/Gozala/models/raw/master/lib/models.js": "https!github.com/Gozala/models/raw/master/lib/models.js"
                 }
              },
              "https!github.com/Gozala/models/raw/master/lib/models.js": {
                 "id": "https!github.com/Gozala/models/raw/master/lib/models.js",
                 "path": "node_modules/https!github.com/Gozala/models/raw/master/lib/models.js",
                 "uri": "https://github.com/Gozala/models/raw/master/lib/models.js",
                 "source": "....",
                 "requirements": {
                    "./events": "https!github.com/Gozala/models/raw/master/lib/events.js"
                 }
              },
              "https!github.com/Gozala/models/raw/master/lib/events.js": {
                 "id": "https!github.com/Gozala/models/raw/master/lib/events.js",
                 "path": "node_modules/https!github.com/Gozala/models/raw/master/lib/events.js",
                 "uri": "https://github.com/Gozala/models/raw/master/lib/events.js",
                 "source": "....",
                 "requirements": {
                    "./extendables": "https!github.com/Gozala/models/raw/master/lib/extendables.js"
                 }
              },
              "https!github.com/Gozala/models/raw/master/lib/extendables.js": {
                 "id": "https!github.com/Gozala/models/raw/master/lib/extendables.js",
                 "path": "node_modules/https!github.com/Gozala/models/raw/master/lib/extendables.js",
                 "uri": "https://github.com/Gozala/models/raw/master/lib/extendables.js",
                 "source": "....."
              }
           }
        }


3. Install missing dependencies to the local filesystem:

        graphquire --write path/to/package.json

4. No longer used dependencies can be also cleaned up by additional argument:

        graphquire --write --clean path/to/package.json
