### vim:set ts=2 sw=2 sts=2 et autoread: ###

define ?= ($)-> $(require, exports, module)

define (require, exports, module)->
  'use strict'

  COMMENT_PATTERN = ///
  (                       # matching multi-line comment blocks.
    /\*                   # opening of the multi-line comment block: "/*".
    [\s\S]*?              # matching anything but in a non-greedy way to make
                          # sure that we don't also match things between
                          # first and last multi-line comment blocks.
    \*/                   # closing of the multi-line comment block: "*/".
  ) | (                   # and single line comments.
    # Match from the beginning of line or an input
    (^|\n)
    # Match any symbols except quotes and line breaks, as quoted '//' is not
    # comment and if we have a line break we need to start over.
    # Please note that comments like following will not be stripped out:
    # var foo = "bar"; // something here
    # Still we ignore as it's pretty unlikely to have module imports in such
    # comments.
    [^('|"|\n)]*
    # Match a single line comment string '//'
    //
    # Till a nearest line break
    [^\n]*
  )
  ///g

  REQUIRE_PATTERN = ///
  require                 # require function call.
  \s*\(['"]               # Any number of white-spaces followed by `("` or `('`
  ([\w\W]*?)              # Any combination alphanumeric chars -> module id
  ['"]\s*\)               # Any number of white-spaces followed by `')` or `")`
  ///g
  
  exports.depends = (source)->
    dependencies = []
    source = String(source).replace COMMENT_PATTERN, ''
    while dependency = REQUIRE_PATTERN.exec source
      dependencies.push dependency[1]
    dependencies

  exports
