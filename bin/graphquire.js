(function() {
  /* vim:set ts=2 sw=2 sts=2 et autoread: */  var graphquire;
  graphquire = require('../graphquire');
  process.stdin.resume(true);
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(content) {
    return process.stdout.write(graphquire.depends(content).join('\n'));
  });
}).call(this);
