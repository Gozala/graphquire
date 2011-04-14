#!/usr/bin/env coffee
### vim:set ts=2 sw=2 sts=2 et autoread: ###

graphquire = require '../graphquire'
process.stdin.resume yes
process.stdin.setEncoding 'utf8'

process.stdin.on 'data', (content) ->
  process.stdout.write graphquire.depends(content).join('\n')
