// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/7c3dce0/lib/internal/modules/package_json_reader.js>
// Last checked on: Apr 29, 2023.
// Removed the native dependency.
// Also: no need to cache, we do that in resolve already.
/**
 * @typedef {import('./errors.js').ErrnoException} ErrnoException
 *
 * @typedef {'commonjs' | 'module' | 'none'} PackageType
 *
 * @typedef PackageConfig
 * @property {string} pjsonPath
 * @property {boolean} exists
 * @property {string | undefined} [main]
 * @property {string | undefined} [name]
 * @property {PackageType} type
 * @property {Record<string, unknown> | undefined} [exports]
 * @property {Record<string, unknown> | undefined} [imports]
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
    getPackageScopeConfig: function() {
        return getPackageScopeConfig;
    },
    getPackageType: function() {
        return getPackageType;
    },
    read: function() {
        return read;
    }
});
var _nodefs = /*#__PURE__*/ _interop_require_default(require("node:fs"));
var _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
var _nodeurl = require("node:url");
var _errors = require("./errors.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
var hasOwnProperty = {}.hasOwnProperty;
var ERR_INVALID_PACKAGE_CONFIG = _errors.codes.ERR_INVALID_PACKAGE_CONFIG;
/** @type {Map<string, PackageConfig>} */ var cache = new Map();
function read(jsonPath, param) {
    var base = param.base, specifier = param.specifier;
    var existing = cache.get(jsonPath);
    if (existing) {
        return existing;
    }
    /** @type {string | undefined} */ var string;
    try {
        string = _nodefs.default.readFileSync(_nodepath.default.toNamespacedPath(jsonPath), 'utf8');
    } catch (error) {
        var exception = /** @type {ErrnoException} */ error;
        if (exception.code !== 'ENOENT') {
            throw exception;
        }
    }
    /** @type {PackageConfig} */ var result = {
        exists: false,
        pjsonPath: jsonPath,
        main: undefined,
        name: undefined,
        type: 'none',
        exports: undefined,
        imports: undefined
    };
    if (string !== undefined) {
        /** @type {Record<string, unknown>} */ var parsed;
        try {
            parsed = JSON.parse(string);
        } catch (error_) {
            var cause = /** @type {ErrnoException} */ error_;
            var _$error = new ERR_INVALID_PACKAGE_CONFIG(jsonPath, (base ? '"'.concat(specifier, '" from ') : '') + (0, _nodeurl.fileURLToPath)(base || specifier), cause.message);
            _$error.cause = cause;
            throw _$error;
        }
        result.exists = true;
        if (hasOwnProperty.call(parsed, 'name') && typeof parsed.name === 'string') {
            result.name = parsed.name;
        }
        if (hasOwnProperty.call(parsed, 'main') && typeof parsed.main === 'string') {
            result.main = parsed.main;
        }
        if (hasOwnProperty.call(parsed, 'exports')) {
            // @ts-expect-error: assume valid.
            result.exports = parsed.exports;
        }
        if (hasOwnProperty.call(parsed, 'imports')) {
            // @ts-expect-error: assume valid.
            result.imports = parsed.imports;
        }
        // Ignore unknown types for forwards compatibility
        if (hasOwnProperty.call(parsed, 'type') && (parsed.type === 'commonjs' || parsed.type === 'module')) {
            result.type = parsed.type;
        }
    }
    cache.set(jsonPath, result);
    return result;
}
function getPackageScopeConfig(resolved) {
    // Note: in Node, this is now a native module.
    var packageJSONUrl = new URL('package.json', resolved);
    while(true){
        var packageJSONPath = packageJSONUrl.pathname;
        if (packageJSONPath.endsWith('node_modules/package.json')) {
            break;
        }
        var packageConfig = read((0, _nodeurl.fileURLToPath)(packageJSONUrl), {
            specifier: resolved
        });
        if (packageConfig.exists) {
            return packageConfig;
        }
        var lastPackageJSONUrl = packageJSONUrl;
        packageJSONUrl = new URL('../package.json', packageJSONUrl);
        // Terminates at root where ../package.json equals ../../package.json
        // (can't just check "/package.json" for Windows support).
        if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) {
            break;
        }
    }
    var packageJSONPath1 = (0, _nodeurl.fileURLToPath)(packageJSONUrl);
    // ^^ Note: in Node, this is now a native module.
    return {
        pjsonPath: packageJSONPath1,
        exists: false,
        type: 'none'
    };
}
function getPackageType(url) {
    // To do @anonrig: Write a C++ function that returns only "type".
    return getPackageScopeConfig(url).type;
}
