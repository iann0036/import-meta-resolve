/**
 * @typedef {import('./lib/errors.js').ErrnoException} ErrnoException
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    moduleResolve: function() {
        return _resolve.moduleResolve;
    },
    resolve: function() {
        return resolve;
    }
});
var _resolve = require("./lib/resolve.js");
function resolve(specifier, parent) {
    if (!parent) {
        throw new Error('Please pass `parent`: `import-meta-resolve` cannot ponyfill that');
    }
    try {
        return (0, _resolve.defaultResolve)(specifier, {
            parentURL: parent
        }).url;
    } catch (error) {
        // See: <https://github.com/nodejs/node/blob/45f5c9b/lib/internal/modules/esm/initialize_import_meta.js#L34>
        var exception = /** @type {ErrnoException} */ error;
        if ((exception.code === 'ERR_UNSUPPORTED_DIR_IMPORT' || exception.code === 'ERR_MODULE_NOT_FOUND') && typeof exception.url === 'string') {
            return exception.url;
        }
        throw error;
    }
}
