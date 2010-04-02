var REQUIRE_MATCH = /[^\w\_]require\s*\(('|")([\w\W]*?)('|")\)/g;
var COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g;

exports.resolve = function resolve(id, baseId) {
    if (0 < id.indexOf("://")) return id;
    var part, parts = id.split("/");
    var root = parts[0];
    if (root.charAt(0) != ".") return id;
    baseId = baseId || "";
    var base = baseId.split("/");
    base.pop();
    while (part = parts.shift()) {
        if (part == ".") continue;
        if (part == ".." && base.length) base.pop();
        else base.push(part);
    }
    return base.join("/");
};
exports.requires = function requires(source) {
    var source = source.replace(COMMENTS_MATCH, "");
    var dependency, dependencies = [];
    while(depenedency = REQUIRE_MATCH.exec(source)) dependencies.push(depenedency[2]);
    return dependencies;
}