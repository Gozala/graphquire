#!/usr/bin/env coffee
### vim:set ts=2 sw=2 sts=2 et autoread: ###

graphquire = require '../graphquire'
fs = require 'fs'
path = require 'path'

program = path.join process.cwd(), process.argv[2]

console.log "Creating require graph for -> #{program}"

fs.readFile program, (error, source) ->
  console.log(graphquire.depends(source))
