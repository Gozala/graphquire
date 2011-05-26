#!/usr/bin/env node

/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false globalstrict: true */
/*global define: true */

'use strict';

var graphquire = require('../graphquire')

var options = {
  location: process.argv[2] || process.cwd(),
  cachePath: './node_modules'
}
graphquire.getGraph(options, function(error, graph) {
  if (error) console.trace(error)
  else console.log(JSON.stringify(graph, '', '  '))
})
