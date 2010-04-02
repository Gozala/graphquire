var PACKAGES = require("./packages");
var MODULES = require("./modules");
var DEPENDENCY = require("./dependency");
var SYSTEM = require("system");
var FS = require("file");
var catalog = exports.catalog = exports.packages = {};
var main = exports.main = function main(path) {
    var module, lib = {};
    // create copy of a catalog
    var packages = JSON.parse(JSON.stringify(PACKAGES.main(path)));
    for (var id in packages) {
        var descriptor = catalog[id] = packages[id];
        var path = FS.path(descriptor.graphquire.path).join(descriptor.directories.lib);
        var modules = descriptor.graphquire.modules = {};
        // goes through each module, gets descriptor and finds it's dependencies
        MODULES.discoverModules(path).map(function(path) {
            return MODULES.moduleDescriptor(path, descriptor)
        }).forEach(function extend(descriptor) {
            modules[descriptor.id] = lib[descriptor.id] = descriptor;
            descriptor.requires = DEPENDENCY.requires(MODULES.source(descriptor.path));
            descriptor.depends = {};
            // collect module descriptors to fix dependency ids on next iteratio
        });
    };
    for (var id in lib) {
        var descriptor = lib[id];
        var dependencies = descriptor.requires, depends = descriptor.depends, baseId = descriptor.id;
        for (var i = 0, ii = dependencies.length; i < ii; i++) {
            var id = DEPENDENCY.resolve(dependencies[i], baseId)
            depends[id] = lib[id];
        }
    }
    return catalog;
}
if (require.main == module) main(SYSTEM.args[1]);