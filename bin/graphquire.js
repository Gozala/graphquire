(function() {
  /* vim:set ts=2 sw=2 sts=2 et autoread: */  var fs, graphquire, path, program;
  graphquire = require('../graphquire');
  fs = require('fs');
  path = require('path');
  program = path.join(process.cwd(), process.argv[2]);
  console.log("Creating require graph for -> " + program);
  fs.readFile(program, function(error, source) {
    return console.log(graphquire.depends(source));
  });
}).call(this);
