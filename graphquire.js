(function() {
  /* vim:set ts=2 sw=2 sts=2 et autoread: */  typeof define != "undefined" && define !== null ? define : define = function($) {
    return $(require, exports, module);
  };
  define(function(require, exports, module) {
    'use strict';    var COMMENT_PATTERN, REQUIRE_PATTERN;
    COMMENT_PATTERN = /(\/\*[\s\S]*?\*\/)|((^|\n)[^('|"|\n)]*\/\/[^\n]*)/g;
    REQUIRE_PATTERN = /require\s*\(['"]([\w\W]*?)['"]\s*\)/g;
    exports.depends = function(source) {
      var dependencies, dependency;
      dependencies = [];
      source = String(source).replace(COMMENT_PATTERN, '');
      while (dependency = REQUIRE_PATTERN.exec(source)) {
        dependencies.push(dependency[1]);
      }
      return dependencies;
    };
    return exports;
  });
}).call(this);
