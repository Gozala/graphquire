# graphquire #

Web is awesome: cross platform, fully distributed and yet connected via [URL]s.

This project is an attempt, to apply same principles for building a web itself.
Idea is to build a fully distributed ecosystem (without any type of central
authority) of cross platform JavaScript modules connected via URLs. Each module
doing one thing only, but doing it well! Something to start building [harmony
of our dreams]!

## Tool ##

This is a module linker / graph builder, that may be used to build module
dependency graph starting form a package's main module. Graphequire recognizes
two types of module requirements:

  1. Relative id:
     `require('./foo/bar')`  
     `require('./bla.js')`  
     `require('../baz')`

  2. URL:  
     `require('foo.org/bar')        // http://foo.org/bar.js`  
     `require('!bla.org/baz')       // https://bla.org/baz.js`

All other type of require's are assumed to be engine specific and are left up
to engine.

## Install ##

      npm install graphquire

## Usage ##

### NodeJS ##

You can use `graphquire` to install all URL type modules that your project
depends on as part of npm's install step. To do so you just need to do
following:

1. Add `graphquire` to your `dependencies` in `package.json` file:

        "dependencies": {
          "graphquire": ">=0.7.0"
        }

2. Add `install` `script` in `package.json` file:

        "scripts": {
          "install": "graphquire --clean --write"
        }

### Jetpack ###

You can use `graphquire` with jetpack:

1. Via command line:

        graphquire --clean --write --cache-path ./

2. Or via npm, in this case you need to do a same thing as in instructions for
   node with a difference that `install` script will look slightly different:

        "scripts": {
          "install": "graphquire --clean --write --cache-path ./"
        }

### Browser ###

You can use on of many CommonJS [module loaders](http://jsm.io/jsm.js) for
browsers.

### CLI ###

You can use `graphquire` as a command line tool:

1. To analyze dependency graph by running `graphquire` command on the
`package.json` file of javascript package:

        graphquire test/fixtures/pckg-cached/package.json

        {
           "path": "test/fixtures/pckg-cached/package.json",
           "uri": "./",
           "cachePath": "./node_modules",
           "includesSource": true,
           "metadata": {
              "name": "pckg1"
           },
           "modules": {
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
                 "id": "!bar.org/c"
              }
           }
        }

2. You can also analyze dependency graphs on the remote packages (Output will
   contain module source if `--no-source` option is not used).

        graphquire --no-source https://raw.github.com/Gozala/graphquire/master/test/fixtures/pckg-uncached/package.json

        {
           "path": "./",
           "uri": "https://raw.github.com/Gozala/graphquire/master/test/fixtures/pckg-uncached/package.json",
           "cachePath": "./node_modules",
           "includesSource": false,
           "metadata": {
              "name": "pckg2",
              "version": "0.0.1",
              "description": "test package with remote dependencies"
           },
           "modules": {
              "./index.js": {
                 "id": "./index.js",
                 "requirements": {
                    "!raw.github.com/Gozala/models/master/models": "!raw.github.com/Gozala/models/master/models"
                 }
              },
              "!raw.github.com/Gozala/models/master/models": {
                 "id": "!raw.github.com/Gozala/models/master/models",
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
           }
        }


3. You can install / cache missing dependencies of your package into filesystem:

        graphquire --write path/to/package.json

4. Obsolete dependencies can be also cleaned up using additional argument:

        graphquire --write --clean path/to/package.json

5. You can specify package relative cache path (defaults to `node_modules`):

        graphquire --write --clean --cache-path ./support path/to/package.json

[URL]:http://en.wikipedia.org/wiki/Uniform_Resource_Locator
[harmony of our dreams]:http://wiki.ecmascript.org/doku.php?id=harmony:modules
