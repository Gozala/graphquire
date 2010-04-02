exports._ = function _(string) {
    var params = Array.prototype.slice.call(arguments, 1),
        id = 0; // the current index for non-numerical replacements
    return string.replace(/%@([0-9]+)?/g, function(param, index) {
        param = params[((index) ? parseInt(index, 0) - 1 : id ++)];
        return ((param === null) ? '(null)' : ( param === undefined) ? '' : param).toString();
    });
}