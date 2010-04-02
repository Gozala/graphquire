#!/usr/bin/env narwhal

var GRAPH = require("./main");
var _ = require("./utils")._;
var print = require("system").print;
//var OS = require("OS");

var YUML_URL = "http://yuml.me/diagram/class/"
var SLASH = "∕";
var PACKAGE = "[note:%@:%@ (%@){bg:cornsilk}]"
var MODULE = "[%@]";
var DEPENDENCY = "[%@]->[%@]";
var REQUIREMENT = "[%@]=>[%@]"

function render(data) {
    //data = encode(data.join("\n"));
    //print(data)
    //print("open '" + YUML_URL + data + "'");
    data.forEach(function(msg) {
        print(msg);
    });
}
function encode(string) {
    return string;//.replace(/\//g, SLASH).replace(/\n/g, "\\\\n");
}

var main = exports.main = function main(dir) {
    var packages = GRAPH.main(dir);
    var data = [];
    for (var id in packages) {
        var descriptor = packages[id];
        data.push(_(PACKAGE, descriptor.name, descriptor.version, descriptor.description));
        var modules = descriptor.graphquire.modules;
        for (var id in modules) {
            var module = modules[id];
            if (0 === module.requires.length) data.push(_(MODULE, id));
            else {
                var dependencies = module.depends;
                for (var dependency in dependencies) {
                    data.push(_(undefined === dependencies[dependency] ? REQUIREMENT : DEPENDENCY, id, dependency));
                }
            }
        }
    }
    render(data)
}

if (require.main == module) main(system.args[1])