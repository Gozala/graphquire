var FS = require("file");

exports.discoverModules = function discoverModules(path) {
    return FS.path(path).listTreePaths().filter(function(path) {
        return (path.isFile() && path.extension() === ".js")
    }).map(function(path) {
        return path.absolute();
    });
};
exports.moduleDescriptor = function moduleDescriptor(path, packageDescriptor) {
    // get read of `/` #todo
    var lib = FS.path(packageDescriptor.graphquire.path).join(packageDescriptor.directories.lib, "/");
    var relative = lib.relative(FS.path(path).absolute());
    var index = relative.lastIndexOf(".js");
    return {
        path: path.absolute().toString(),
        id: (index > 0) ? relative.toString().substr(0, index) : relative.toString()
    };
};
exports.source = function source(path) {
    return FS.path(path).read().toString();
}