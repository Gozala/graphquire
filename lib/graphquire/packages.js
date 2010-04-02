var FS = require("file");

var catalog = exports.catalog = {};
var discoverPackages = exports.discoverPackages = function discoverPackages(path) {
    var packages = [];
    if (path.join("package.json").exists()) { // path is package folder ?
        packages.push(path);
    } else { // path folder containing packages ?
        packages = path.listPaths().filter(function(path) {
            return path.join("package.json").exists();
        });
        if (0 === packages.length) { // path is under the package folder ?
            while (!path.join("package.json").exists() && path !== path.join("..")) path = path.join("..");
            if (path.join("package.json").exists()) packages.push(path);
        }
    }
    return packages;
};
var normalizePackageDescriptor = exports.normalizePackageDescriptor = function normalizePackageDescriptor(descriptor) {
    descriptor.name = descriptor.name.toString();
    descriptor.description = (descriptor.description || descriptor.name).toString();
    var directories = descriptor.directories || (descriptor.directories = {});
    if (directories.lib === undefined) directories.lib = "lib";
    return descriptor;
};
var packageDescriptor = exports.packageDescriptor = function packageDescriptor(path) {
    path = FS.path(path).absolute();
    var descriptor = normalizePackageDescriptor(JSON.parse(path.join("package.json").read().toString()));
    var meta = descriptor.graphquire || (descriptor.graphquire = {});
    meta.path = path.toString();
    return descriptor;
};
var main = exports.main = function main(path) {
    discoverPackages(FS.path(path || ".").absolute()).forEach(function (path) {
        try {
            var descriptor = packageDescriptor(path);
            catalog[descriptor.name] = descriptor;
        } catch(e) {
            // log error #todo
        }
    });
    return catalog;
}

if (require.main == module) main();