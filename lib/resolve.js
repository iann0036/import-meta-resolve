// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/81a9a97/lib/internal/modules/esm/resolve.js>
// Last checked on: Apr 29, 2023.
/**
 * @typedef {import('node:fs').Stats} Stats
 * @typedef {import('./errors.js').ErrnoException} ErrnoException
 * @typedef {import('./package-json-reader.js').PackageConfig} PackageConfig
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
    defaultResolve: function() {
        return defaultResolve;
    },
    moduleResolve: function() {
        return moduleResolve;
    }
});
var _nodeassert = /*#__PURE__*/ _interop_require_default(require("node:assert"));
var _nodefs = require("node:fs");
var _nodeprocess = /*#__PURE__*/ _interop_require_default(require("node:process"));
var _nodeurl = require("node:url");
var _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
var _nodemodule = require("node:module");
var _getformat = require("./get-format.js");
var _errors = require("./errors.js");
var _packagejsonreader = require("./package-json-reader.js");
var _utils = require("./utils.js");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var RegExpPrototypeSymbolReplace = RegExp.prototype[Symbol.replace];
var ERR_NETWORK_IMPORT_DISALLOWED = _errors.codes.ERR_NETWORK_IMPORT_DISALLOWED, ERR_INVALID_MODULE_SPECIFIER = _errors.codes.ERR_INVALID_MODULE_SPECIFIER, ERR_INVALID_PACKAGE_CONFIG = _errors.codes.ERR_INVALID_PACKAGE_CONFIG, ERR_INVALID_PACKAGE_TARGET = _errors.codes.ERR_INVALID_PACKAGE_TARGET, ERR_MODULE_NOT_FOUND = _errors.codes.ERR_MODULE_NOT_FOUND, ERR_PACKAGE_IMPORT_NOT_DEFINED = _errors.codes.ERR_PACKAGE_IMPORT_NOT_DEFINED, ERR_PACKAGE_PATH_NOT_EXPORTED = _errors.codes.ERR_PACKAGE_PATH_NOT_EXPORTED, ERR_UNSUPPORTED_DIR_IMPORT = _errors.codes.ERR_UNSUPPORTED_DIR_IMPORT, ERR_UNSUPPORTED_RESOLVE_REQUEST = _errors.codes.ERR_UNSUPPORTED_RESOLVE_REQUEST;
var own = {}.hasOwnProperty;
var invalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))?(\\|\/|$)/i;
var deprecatedInvalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
var invalidPackageNameRegEx = /^\.|%|\\/;
var patternRegEx = /\*/g;
var encodedSeparatorRegEx = /%2f|%5c/i;
/** @type {Set<string>} */ var emittedPackageWarnings = new Set();
var doubleSlashRegEx = /[/\\]{2}/;
/**
 *
 * @param {string} target
 * @param {string} request
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} base
 * @param {boolean} isTarget
 */ function emitInvalidSegmentDeprecation(target, request, match, packageJsonUrl, internal, base, isTarget) {
    // @ts-expect-error: apparently it does exist, TS.
    if (_nodeprocess.default.noDeprecation) {
        return;
    }
    var pjsonPath = (0, _nodeurl.fileURLToPath)(packageJsonUrl);
    var double = doubleSlashRegEx.exec(isTarget ? target : request) !== null;
    _nodeprocess.default.emitWarning("Use of deprecated ".concat(double ? 'double slash' : 'leading or trailing slash matching', ' resolving "').concat(target, '" for module ') + 'request "'.concat(request, '" ').concat(request === match ? '' : 'matched to "'.concat(match, '" '), 'in the "').concat(internal ? 'imports' : 'exports', '" field module resolution of the package at ').concat(pjsonPath).concat(base ? " imported from ".concat((0, _nodeurl.fileURLToPath)(base)) : '', "."), 'DeprecationWarning', 'DEP0166');
}
/**
 * @param {URL} url
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @param {string} [main]
 * @returns {void}
 */ function emitLegacyIndexDeprecation(url, packageJsonUrl, base, main) {
    // @ts-expect-error: apparently it does exist, TS.
    if (_nodeprocess.default.noDeprecation) {
        return;
    }
    var format = (0, _getformat.defaultGetFormatWithoutErrors)(url, {
        parentURL: base.href
    });
    if (format !== 'module') return;
    var urlPath = (0, _nodeurl.fileURLToPath)(url.href);
    var packagePath = (0, _nodeurl.fileURLToPath)(new _nodeurl.URL('.', packageJsonUrl));
    var basePath = (0, _nodeurl.fileURLToPath)(base);
    if (!main) {
        _nodeprocess.default.emitWarning('No "main" or "exports" field defined in the package.json for '.concat(packagePath, ' resolving the main entry point "').concat(urlPath.slice(packagePath.length), '", imported from ').concat(basePath, '.\nDefault "index" lookups for the main are deprecated for ES modules.'), 'DeprecationWarning', 'DEP0151');
    } else if (_nodepath.default.resolve(packagePath, main) !== urlPath) {
        _nodeprocess.default.emitWarning("Package ".concat(packagePath, ' has a "main" field set to "').concat(main, '", ') + 'excluding the full filename and extension to the resolved file at "'.concat(urlPath.slice(packagePath.length), '", imported from ').concat(basePath, '.\n Automatic extension resolution of the "main" field is ') + 'deprecated for ES modules.', 'DeprecationWarning', 'DEP0151');
    }
}
/**
 * @param {string} path
 * @returns {Stats | undefined}
 */ function tryStatSync(path) {
    // Note: from Node 15 onwards we can use `throwIfNoEntry: false` instead.
    try {
        return (0, _nodefs.statSync)(path);
    } catch (e) {
    // Note: in Node code this returns `new Stats`,
    // but in Node 22 that’s marked as a deprecated internal API.
    // Which, well, we kinda are, but still to prevent that warning,
    // just yield `undefined`.
    }
}
/**
 * Legacy CommonJS main resolution:
 * 1. let M = pkg_url + (json main field)
 * 2. TRY(M, M.js, M.json, M.node)
 * 3. TRY(M/index.js, M/index.json, M/index.node)
 * 4. TRY(pkg_url/index.js, pkg_url/index.json, pkg_url/index.node)
 * 5. NOT_FOUND
 *
 * @param {URL} url
 * @returns {boolean}
 */ function fileExists(url) {
    var stats = (0, _nodefs.statSync)(url, {
        throwIfNoEntry: false
    });
    var isFile = stats ? stats.isFile() : undefined;
    return isFile === null || isFile === undefined ? false : isFile;
}
/**
 * @param {URL} packageJsonUrl
 * @param {PackageConfig} packageConfig
 * @param {URL} base
 * @returns {URL}
 */ function legacyMainResolve(packageJsonUrl, packageConfig, base) {
    /** @type {URL | undefined} */ var guess;
    if (packageConfig.main !== undefined) {
        guess = new _nodeurl.URL(packageConfig.main, packageJsonUrl);
        // Note: fs check redundances will be handled by Descriptor cache here.
        if (fileExists(guess)) return guess;
        var tries = [
            "./".concat(packageConfig.main, ".js"),
            "./".concat(packageConfig.main, ".json"),
            "./".concat(packageConfig.main, ".node"),
            "./".concat(packageConfig.main, "/index.js"),
            "./".concat(packageConfig.main, "/index.json"),
            "./".concat(packageConfig.main, "/index.node")
        ];
        var i = -1;
        while(++i < tries.length){
            guess = new _nodeurl.URL(tries[i], packageJsonUrl);
            if (fileExists(guess)) break;
            guess = undefined;
        }
        if (guess) {
            emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
            return guess;
        }
    // Fallthrough.
    }
    var tries1 = [
        './index.js',
        './index.json',
        './index.node'
    ];
    var i1 = -1;
    while(++i1 < tries1.length){
        guess = new _nodeurl.URL(tries1[i1], packageJsonUrl);
        if (fileExists(guess)) break;
        guess = undefined;
    }
    if (guess) {
        emitLegacyIndexDeprecation(guess, packageJsonUrl, base, packageConfig.main);
        return guess;
    }
    // Not found.
    throw new ERR_MODULE_NOT_FOUND((0, _nodeurl.fileURLToPath)(new _nodeurl.URL('.', packageJsonUrl)), (0, _nodeurl.fileURLToPath)(base));
}
/**
 * @param {URL} resolved
 * @param {URL} base
 * @param {boolean} [preserveSymlinks]
 * @returns {URL}
 */ function finalizeResolution(resolved, base, preserveSymlinks) {
    if (encodedSeparatorRegEx.exec(resolved.pathname) !== null) {
        throw new ERR_INVALID_MODULE_SPECIFIER(resolved.pathname, 'must not include encoded "/" or "\\" characters', (0, _nodeurl.fileURLToPath)(base));
    }
    /** @type {string} */ var filePath;
    try {
        filePath = (0, _nodeurl.fileURLToPath)(resolved);
    } catch (error) {
        var cause = /** @type {ErrnoException} */ error;
        Object.defineProperty(cause, 'input', {
            value: String(resolved)
        });
        Object.defineProperty(cause, 'module', {
            value: String(base)
        });
        throw cause;
    }
    var stats = tryStatSync(filePath.endsWith('/') ? filePath.slice(-1) : filePath);
    if (stats && stats.isDirectory()) {
        var _$error = new ERR_UNSUPPORTED_DIR_IMPORT(filePath, (0, _nodeurl.fileURLToPath)(base));
        // @ts-expect-error Add this for `import.meta.resolve`.
        _$error.url = String(resolved);
        throw _$error;
    }
    if (!stats || !stats.isFile()) {
        var _$error1 = new ERR_MODULE_NOT_FOUND(filePath || resolved.pathname, base && (0, _nodeurl.fileURLToPath)(base), true);
        // @ts-expect-error Add this for `import.meta.resolve`.
        _$error1.url = String(resolved);
        throw _$error1;
    }
    if (!preserveSymlinks) {
        var real = (0, _nodefs.realpathSync)(filePath);
        var search = resolved.search, hash = resolved.hash;
        resolved = (0, _nodeurl.pathToFileURL)(real + (filePath.endsWith(_nodepath.default.sep) ? '/' : ''));
        resolved.search = search;
        resolved.hash = hash;
    }
    return resolved;
}
/**
 * @param {string} specifier
 * @param {URL | undefined} packageJsonUrl
 * @param {URL} base
 * @returns {Error}
 */ function importNotDefined(specifier, packageJsonUrl, base) {
    return new ERR_PACKAGE_IMPORT_NOT_DEFINED(specifier, packageJsonUrl && (0, _nodeurl.fileURLToPath)(new _nodeurl.URL('.', packageJsonUrl)), (0, _nodeurl.fileURLToPath)(base));
}
/**
 * @param {string} subpath
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @returns {Error}
 */ function exportsNotFound(subpath, packageJsonUrl, base) {
    return new ERR_PACKAGE_PATH_NOT_EXPORTED((0, _nodeurl.fileURLToPath)(new _nodeurl.URL('.', packageJsonUrl)), subpath, base && (0, _nodeurl.fileURLToPath)(base));
}
/**
 * @param {string} request
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} [base]
 * @returns {never}
 */ function throwInvalidSubpath(request, match, packageJsonUrl, internal, base) {
    var reason = 'request is not a valid match in pattern "'.concat(match, '" for the "').concat(internal ? 'imports' : 'exports', '" resolution of ').concat((0, _nodeurl.fileURLToPath)(packageJsonUrl));
    throw new ERR_INVALID_MODULE_SPECIFIER(request, reason, base && (0, _nodeurl.fileURLToPath)(base));
}
/**
 * @param {string} subpath
 * @param {unknown} target
 * @param {URL} packageJsonUrl
 * @param {boolean} internal
 * @param {URL} [base]
 * @returns {Error}
 */ function invalidPackageTarget(subpath, target, packageJsonUrl, internal, base) {
    target = (typeof target === "undefined" ? "undefined" : _type_of(target)) === 'object' && target !== null ? JSON.stringify(target, null, '') : "".concat(target);
    return new ERR_INVALID_PACKAGE_TARGET((0, _nodeurl.fileURLToPath)(new _nodeurl.URL('.', packageJsonUrl)), subpath, target, internal, base && (0, _nodeurl.fileURLToPath)(base));
}
/**
 * @param {string} target
 * @param {string} subpath
 * @param {string} match
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @param {boolean} pattern
 * @param {boolean} internal
 * @param {boolean} isPathMap
 * @param {Set<string> | undefined} conditions
 * @returns {URL}
 */ function resolvePackageTargetString(target, subpath, match, packageJsonUrl, base, pattern, internal, isPathMap, conditions) {
    if (subpath !== '' && !pattern && target[target.length - 1] !== '/') throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
    if (!target.startsWith('./')) {
        if (internal && !target.startsWith('../') && !target.startsWith('/')) {
            var isURL = false;
            try {
                new _nodeurl.URL(target);
                isURL = true;
            } catch (e) {
            // Continue regardless of error.
            }
            if (!isURL) {
                var exportTarget = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, function() {
                    return subpath;
                }) : target + subpath;
                return packageResolve(exportTarget, packageJsonUrl, conditions);
            }
        }
        throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
    }
    if (invalidSegmentRegEx.exec(target.slice(2)) !== null) {
        if (deprecatedInvalidSegmentRegEx.exec(target.slice(2)) === null) {
            if (!isPathMap) {
                var request = pattern ? match.replace('*', function() {
                    return subpath;
                }) : match + subpath;
                var resolvedTarget = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, function() {
                    return subpath;
                }) : target;
                emitInvalidSegmentDeprecation(resolvedTarget, request, match, packageJsonUrl, internal, base, true);
            }
        } else {
            throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
        }
    }
    var resolved = new _nodeurl.URL(target, packageJsonUrl);
    var resolvedPath = resolved.pathname;
    var packagePath = new _nodeurl.URL('.', packageJsonUrl).pathname;
    if (!resolvedPath.startsWith(packagePath)) throw invalidPackageTarget(match, target, packageJsonUrl, internal, base);
    if (subpath === '') return resolved;
    if (invalidSegmentRegEx.exec(subpath) !== null) {
        var request1 = pattern ? match.replace('*', function() {
            return subpath;
        }) : match + subpath;
        if (deprecatedInvalidSegmentRegEx.exec(subpath) === null) {
            if (!isPathMap) {
                var resolvedTarget1 = pattern ? RegExpPrototypeSymbolReplace.call(patternRegEx, target, function() {
                    return subpath;
                }) : target;
                emitInvalidSegmentDeprecation(resolvedTarget1, request1, match, packageJsonUrl, internal, base, false);
            }
        } else {
            throwInvalidSubpath(request1, match, packageJsonUrl, internal, base);
        }
    }
    if (pattern) {
        return new _nodeurl.URL(RegExpPrototypeSymbolReplace.call(patternRegEx, resolved.href, function() {
            return subpath;
        }));
    }
    return new _nodeurl.URL(subpath, resolved);
}
/**
 * @param {string} key
 * @returns {boolean}
 */ function isArrayIndex(key) {
    var keyNumber = Number(key);
    if ("".concat(keyNumber) !== key) return false;
    return keyNumber >= 0 && keyNumber < 0xffffffff;
}
/**
 * @param {URL} packageJsonUrl
 * @param {unknown} target
 * @param {string} subpath
 * @param {string} packageSubpath
 * @param {URL} base
 * @param {boolean} pattern
 * @param {boolean} internal
 * @param {boolean} isPathMap
 * @param {Set<string> | undefined} conditions
 * @returns {URL | null}
 */ function resolvePackageTarget(packageJsonUrl, target, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions) {
    if (typeof target === 'string') {
        return resolvePackageTargetString(target, subpath, packageSubpath, packageJsonUrl, base, pattern, internal, isPathMap, conditions);
    }
    if (Array.isArray(target)) {
        /** @type {Array<unknown>} */ var targetList = target;
        if (targetList.length === 0) return null;
        /** @type {ErrnoException | null | undefined} */ var lastException;
        var i = -1;
        while(++i < targetList.length){
            var targetItem = targetList[i];
            /** @type {URL | null} */ var resolveResult = void 0;
            try {
                resolveResult = resolvePackageTarget(packageJsonUrl, targetItem, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions);
            } catch (error) {
                var exception = /** @type {ErrnoException} */ error;
                lastException = exception;
                if (exception.code === 'ERR_INVALID_PACKAGE_TARGET') continue;
                throw error;
            }
            if (resolveResult === undefined) continue;
            if (resolveResult === null) {
                lastException = null;
                continue;
            }
            return resolveResult;
        }
        if (lastException === undefined || lastException === null) {
            return null;
        }
        throw lastException;
    }
    if ((typeof target === "undefined" ? "undefined" : _type_of(target)) === 'object' && target !== null) {
        var keys = Object.getOwnPropertyNames(target);
        var i1 = -1;
        while(++i1 < keys.length){
            var key = keys[i1];
            if (isArrayIndex(key)) {
                throw new ERR_INVALID_PACKAGE_CONFIG((0, _nodeurl.fileURLToPath)(packageJsonUrl), base, '"exports" cannot contain numeric property keys.');
            }
        }
        i1 = -1;
        while(++i1 < keys.length){
            var key1 = keys[i1];
            if (key1 === 'default' || conditions && conditions.has(key1)) {
                // @ts-expect-error: indexable.
                var conditionalTarget = /** @type {unknown} */ target[key1];
                var resolveResult1 = resolvePackageTarget(packageJsonUrl, conditionalTarget, subpath, packageSubpath, base, pattern, internal, isPathMap, conditions);
                if (resolveResult1 === undefined) continue;
                return resolveResult1;
            }
        }
        return null;
    }
    if (target === null) {
        return null;
    }
    throw invalidPackageTarget(packageSubpath, target, packageJsonUrl, internal, base);
}
/**
 * @param {unknown} exports
 * @param {URL} packageJsonUrl
 * @param {URL} base
 * @returns {boolean}
 */ function isConditionalExportsMainSugar(exports1, packageJsonUrl, base) {
    if (typeof exports1 === 'string' || Array.isArray(exports1)) return true;
    if ((typeof exports1 === "undefined" ? "undefined" : _type_of(exports1)) !== 'object' || exports1 === null) return false;
    var keys = Object.getOwnPropertyNames(exports1);
    var isConditionalSugar = false;
    var i = 0;
    var keyIndex = -1;
    while(++keyIndex < keys.length){
        var key = keys[keyIndex];
        var currentIsConditionalSugar = key === '' || key[0] !== '.';
        if (i++ === 0) {
            isConditionalSugar = currentIsConditionalSugar;
        } else if (isConditionalSugar !== currentIsConditionalSugar) {
            throw new ERR_INVALID_PACKAGE_CONFIG((0, _nodeurl.fileURLToPath)(packageJsonUrl), base, '"exports" cannot contain some keys starting with \'.\' and some not.' + ' The exports object must either be an object of package subpath keys' + ' or an object of main entry condition name keys only.');
        }
    }
    return isConditionalSugar;
}
/**
 * @param {string} match
 * @param {URL} pjsonUrl
 * @param {URL} base
 */ function emitTrailingSlashPatternDeprecation(match, pjsonUrl, base) {
    // @ts-expect-error: apparently it does exist, TS.
    if (_nodeprocess.default.noDeprecation) {
        return;
    }
    var pjsonPath = (0, _nodeurl.fileURLToPath)(pjsonUrl);
    if (emittedPackageWarnings.has(pjsonPath + '|' + match)) return;
    emittedPackageWarnings.add(pjsonPath + '|' + match);
    _nodeprocess.default.emitWarning('Use of deprecated trailing slash pattern mapping "'.concat(match, '" in the ') + '"exports" field module resolution of the package at '.concat(pjsonPath).concat(base ? " imported from ".concat((0, _nodeurl.fileURLToPath)(base)) : '', '. Mapping specifiers ending in "/" is no longer supported.'), 'DeprecationWarning', 'DEP0155');
}
/**
 * @param {URL} packageJsonUrl
 * @param {string} packageSubpath
 * @param {Record<string, unknown>} packageConfig
 * @param {URL} base
 * @param {Set<string> | undefined} conditions
 * @returns {URL}
 */ function packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions) {
    var exports1 = packageConfig.exports;
    if (isConditionalExportsMainSugar(exports1, packageJsonUrl, base)) {
        exports1 = {
            '.': exports1
        };
    }
    if (own.call(exports1, packageSubpath) && !packageSubpath.includes('*') && !packageSubpath.endsWith('/')) {
        // @ts-expect-error: indexable.
        var target = exports1[packageSubpath];
        var resolveResult = resolvePackageTarget(packageJsonUrl, target, '', packageSubpath, base, false, false, false, conditions);
        if (resolveResult === null || resolveResult === undefined) {
            throw exportsNotFound(packageSubpath, packageJsonUrl, base);
        }
        return resolveResult;
    }
    var bestMatch = '';
    var bestMatchSubpath = '';
    var keys = Object.getOwnPropertyNames(exports1);
    var i = -1;
    while(++i < keys.length){
        var key = keys[i];
        var patternIndex = key.indexOf('*');
        if (patternIndex !== -1 && packageSubpath.startsWith(key.slice(0, patternIndex))) {
            // When this reaches EOL, this can throw at the top of the whole function:
            //
            // if (StringPrototypeEndsWith(packageSubpath, '/'))
            //   throwInvalidSubpath(packageSubpath)
            //
            // To match "imports" and the spec.
            if (packageSubpath.endsWith('/')) {
                emitTrailingSlashPatternDeprecation(packageSubpath, packageJsonUrl, base);
            }
            var patternTrailer = key.slice(patternIndex + 1);
            if (packageSubpath.length >= key.length && packageSubpath.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key) === 1 && key.lastIndexOf('*') === patternIndex) {
                bestMatch = key;
                bestMatchSubpath = packageSubpath.slice(patternIndex, packageSubpath.length - patternTrailer.length);
            }
        }
    }
    if (bestMatch) {
        // @ts-expect-error: indexable.
        var target1 = /** @type {unknown} */ exports1[bestMatch];
        var resolveResult1 = resolvePackageTarget(packageJsonUrl, target1, bestMatchSubpath, bestMatch, base, true, false, packageSubpath.endsWith('/'), conditions);
        if (resolveResult1 === null || resolveResult1 === undefined) {
            throw exportsNotFound(packageSubpath, packageJsonUrl, base);
        }
        return resolveResult1;
    }
    throw exportsNotFound(packageSubpath, packageJsonUrl, base);
}
/**
 * @param {string} a
 * @param {string} b
 */ function patternKeyCompare(a, b) {
    var aPatternIndex = a.indexOf('*');
    var bPatternIndex = b.indexOf('*');
    var baseLengthA = aPatternIndex === -1 ? a.length : aPatternIndex + 1;
    var baseLengthB = bPatternIndex === -1 ? b.length : bPatternIndex + 1;
    if (baseLengthA > baseLengthB) return -1;
    if (baseLengthB > baseLengthA) return 1;
    if (aPatternIndex === -1) return 1;
    if (bPatternIndex === -1) return -1;
    if (a.length > b.length) return -1;
    if (b.length > a.length) return 1;
    return 0;
}
/**
 * @param {string} name
 * @param {URL} base
 * @param {Set<string>} [conditions]
 * @returns {URL}
 */ function packageImportsResolve(name, base, conditions) {
    if (name === '#' || name.startsWith('#/') || name.endsWith('/')) {
        var reason = 'is not a valid internal imports specifier name';
        throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, (0, _nodeurl.fileURLToPath)(base));
    }
    /** @type {URL | undefined} */ var packageJsonUrl;
    var packageConfig = (0, _packagejsonreader.getPackageScopeConfig)(base);
    if (packageConfig.exists) {
        packageJsonUrl = (0, _nodeurl.pathToFileURL)(packageConfig.pjsonPath);
        var imports = packageConfig.imports;
        if (imports) {
            if (own.call(imports, name) && !name.includes('*')) {
                var resolveResult = resolvePackageTarget(packageJsonUrl, imports[name], '', name, base, false, true, false, conditions);
                if (resolveResult !== null && resolveResult !== undefined) {
                    return resolveResult;
                }
            } else {
                var bestMatch = '';
                var bestMatchSubpath = '';
                var keys = Object.getOwnPropertyNames(imports);
                var i = -1;
                while(++i < keys.length){
                    var key = keys[i];
                    var patternIndex = key.indexOf('*');
                    if (patternIndex !== -1 && name.startsWith(key.slice(0, -1))) {
                        var patternTrailer = key.slice(patternIndex + 1);
                        if (name.length >= key.length && name.endsWith(patternTrailer) && patternKeyCompare(bestMatch, key) === 1 && key.lastIndexOf('*') === patternIndex) {
                            bestMatch = key;
                            bestMatchSubpath = name.slice(patternIndex, name.length - patternTrailer.length);
                        }
                    }
                }
                if (bestMatch) {
                    var target = imports[bestMatch];
                    var resolveResult1 = resolvePackageTarget(packageJsonUrl, target, bestMatchSubpath, bestMatch, base, true, true, false, conditions);
                    if (resolveResult1 !== null && resolveResult1 !== undefined) {
                        return resolveResult1;
                    }
                }
            }
        }
    }
    throw importNotDefined(name, packageJsonUrl, base);
}
/**
 * @param {string} specifier
 * @param {URL} base
 */ function parsePackageName(specifier, base) {
    var separatorIndex = specifier.indexOf('/');
    var validPackageName = true;
    var isScoped = false;
    if (specifier[0] === '@') {
        isScoped = true;
        if (separatorIndex === -1 || specifier.length === 0) {
            validPackageName = false;
        } else {
            separatorIndex = specifier.indexOf('/', separatorIndex + 1);
        }
    }
    var packageName = separatorIndex === -1 ? specifier : specifier.slice(0, separatorIndex);
    // Package name cannot have leading . and cannot have percent-encoding or
    // \\ separators.
    if (invalidPackageNameRegEx.exec(packageName) !== null) {
        validPackageName = false;
    }
    if (!validPackageName) {
        throw new ERR_INVALID_MODULE_SPECIFIER(specifier, 'is not a valid package name', (0, _nodeurl.fileURLToPath)(base));
    }
    var packageSubpath = '.' + (separatorIndex === -1 ? '' : specifier.slice(separatorIndex));
    return {
        packageName: packageName,
        packageSubpath: packageSubpath,
        isScoped: isScoped
    };
}
/**
 * @param {string} specifier
 * @param {URL} base
 * @param {Set<string> | undefined} conditions
 * @returns {URL}
 */ function packageResolve(specifier, base, conditions) {
    if (_nodemodule.builtinModules.includes(specifier)) {
        return new _nodeurl.URL('node:' + specifier);
    }
    var _parsePackageName = parsePackageName(specifier, base), packageName = _parsePackageName.packageName, packageSubpath = _parsePackageName.packageSubpath, isScoped = _parsePackageName.isScoped;
    // ResolveSelf
    var packageConfig = (0, _packagejsonreader.getPackageScopeConfig)(base);
    // Can’t test.
    /* c8 ignore next 16 */ if (packageConfig.exists) {
        var packageJsonUrl = (0, _nodeurl.pathToFileURL)(packageConfig.pjsonPath);
        if (packageConfig.name === packageName && packageConfig.exports !== undefined && packageConfig.exports !== null) {
            return packageExportsResolve(packageJsonUrl, packageSubpath, packageConfig, base, conditions);
        }
    }
    var packageJsonUrl1 = new _nodeurl.URL('./node_modules/' + packageName + '/package.json', base);
    var packageJsonPath = (0, _nodeurl.fileURLToPath)(packageJsonUrl1);
    /** @type {string} */ var lastPath;
    do {
        var stat = tryStatSync(packageJsonPath.slice(0, -13));
        if (!stat || !stat.isDirectory()) {
            lastPath = packageJsonPath;
            packageJsonUrl1 = new _nodeurl.URL((isScoped ? '../../../../node_modules/' : '../../../node_modules/') + packageName + '/package.json', packageJsonUrl1);
            packageJsonPath = (0, _nodeurl.fileURLToPath)(packageJsonUrl1);
            continue;
        }
        // Package match.
        var packageConfig1 = (0, _packagejsonreader.read)(packageJsonPath, {
            base: base,
            specifier: specifier
        });
        if (packageConfig1.exports !== undefined && packageConfig1.exports !== null) {
            return packageExportsResolve(packageJsonUrl1, packageSubpath, packageConfig1, base, conditions);
        }
        if (packageSubpath === '.') {
            return legacyMainResolve(packageJsonUrl1, packageConfig1, base);
        }
        return new _nodeurl.URL(packageSubpath, packageJsonUrl1);
    // Cross-platform root check.
    }while (packageJsonPath.length !== lastPath.length);
    throw new ERR_MODULE_NOT_FOUND(packageName, (0, _nodeurl.fileURLToPath)(base), false);
}
/**
 * @param {string} specifier
 * @returns {boolean}
 */ function isRelativeSpecifier(specifier) {
    if (specifier[0] === '.') {
        if (specifier.length === 1 || specifier[1] === '/') return true;
        if (specifier[1] === '.' && (specifier.length === 2 || specifier[2] === '/')) {
            return true;
        }
    }
    return false;
}
/**
 * @param {string} specifier
 * @returns {boolean}
 */ function shouldBeTreatedAsRelativeOrAbsolutePath(specifier) {
    if (specifier === '') return false;
    if (specifier[0] === '/') return true;
    return isRelativeSpecifier(specifier);
}
function moduleResolve(specifier, base, conditions, preserveSymlinks) {
    // Note: The Node code supports `base` as a string (in this internal API) too,
    // we don’t.
    var protocol = base.protocol;
    var isData = protocol === 'data:';
    var isRemote = isData || protocol === 'http:' || protocol === 'https:';
    // Order swapped from spec for minor perf gain.
    // Ok since relative URLs cannot parse as URLs.
    /** @type {URL | undefined} */ var resolved;
    if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
        try {
            resolved = new _nodeurl.URL(specifier, base);
        } catch (error_) {
            var error = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
            error.cause = error_;
            throw error;
        }
    } else if (protocol === 'file:' && specifier[0] === '#') {
        resolved = packageImportsResolve(specifier, base, conditions);
    } else {
        try {
            resolved = new _nodeurl.URL(specifier);
        } catch (error_) {
            // Note: actual code uses `canBeRequiredWithoutScheme`.
            if (isRemote && !_nodemodule.builtinModules.includes(specifier)) {
                var error1 = new ERR_UNSUPPORTED_RESOLVE_REQUEST(specifier, base);
                error1.cause = error_;
                throw error1;
            }
            resolved = packageResolve(specifier, base, conditions);
        }
    }
    (0, _nodeassert.default)(resolved !== undefined, 'expected to be defined');
    if (resolved.protocol !== 'file:') {
        return resolved;
    }
    return finalizeResolution(resolved, base, preserveSymlinks);
}
/**
 * @param {string} specifier
 * @param {URL | undefined} parsed
 * @param {URL | undefined} parsedParentURL
 */ function checkIfDisallowedImport(specifier, parsed, parsedParentURL) {
    if (parsedParentURL) {
        // Avoid accessing the `protocol` property due to the lazy getters.
        var parentProtocol = parsedParentURL.protocol;
        if (parentProtocol === 'http:' || parentProtocol === 'https:') {
            if (shouldBeTreatedAsRelativeOrAbsolutePath(specifier)) {
                // Avoid accessing the `protocol` property due to the lazy getters.
                var parsedProtocol = parsed === null || parsed === void 0 ? void 0 : parsed.protocol;
                // `data:` and `blob:` disallowed due to allowing file: access via
                // indirection
                if (parsedProtocol && parsedProtocol !== 'https:' && parsedProtocol !== 'http:') {
                    throw new ERR_NETWORK_IMPORT_DISALLOWED(specifier, parsedParentURL, 'remote imports cannot import from a local location.');
                }
                return {
                    url: (parsed === null || parsed === void 0 ? void 0 : parsed.href) || ''
                };
            }
            if (_nodemodule.builtinModules.includes(specifier)) {
                throw new ERR_NETWORK_IMPORT_DISALLOWED(specifier, parsedParentURL, 'remote imports cannot import from a local location.');
            }
            throw new ERR_NETWORK_IMPORT_DISALLOWED(specifier, parsedParentURL, 'only relative and absolute specifiers are supported.');
        }
    }
}
// Note: this is from:
// <https://github.com/nodejs/node/blob/3e74590/lib/internal/url.js#L687>
/**
 * Checks if a value has the shape of a WHATWG URL object.
 *
 * Using a symbol or instanceof would not be able to recognize URL objects
 * coming from other implementations (e.g. in Electron), so instead we are
 * checking some well known properties for a lack of a better test.
 *
 * We use `href` and `protocol` as they are the only properties that are
 * easy to retrieve and calculate due to the lazy nature of the getters.
 *
 * @template {unknown} Value
 * @param {Value} self
 * @returns {Value is URL}
 */ function isURL(self) {
    return Boolean(self && (typeof self === "undefined" ? "undefined" : _type_of(self)) === 'object' && 'href' in self && typeof self.href === 'string' && 'protocol' in self && typeof self.protocol === 'string' && self.href && self.protocol);
}
/**
 * Validate user-input in `context` supplied by a custom loader.
 *
 * @param {unknown} parentURL
 * @returns {asserts parentURL is URL | string | undefined}
 */ function throwIfInvalidParentURL(parentURL) {
    if (parentURL === undefined) {
        return; // Main entry point, so no parent
    }
    if (typeof parentURL !== 'string' && !isURL(parentURL)) {
        throw new _errors.codes.ERR_INVALID_ARG_TYPE('parentURL', [
            'string',
            'URL'
        ], parentURL);
    }
}
function defaultResolve(specifier) {
    var context = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    var parentURL = context.parentURL;
    (0, _nodeassert.default)(parentURL !== undefined, 'expected `parentURL` to be defined');
    throwIfInvalidParentURL(parentURL);
    /** @type {URL | undefined} */ var parsedParentURL;
    if (parentURL) {
        try {
            parsedParentURL = new _nodeurl.URL(parentURL);
        } catch (e) {
        // Ignore exception
        }
    }
    /** @type {URL | undefined} */ var parsed;
    /** @type {string | undefined} */ var protocol;
    try {
        parsed = shouldBeTreatedAsRelativeOrAbsolutePath(specifier) ? new _nodeurl.URL(specifier, parsedParentURL) : new _nodeurl.URL(specifier);
        // Avoid accessing the `protocol` property due to the lazy getters.
        protocol = parsed.protocol;
        if (protocol === 'data:') {
            return {
                url: parsed.href,
                format: null
            };
        }
    } catch (e) {
    // Ignore exception
    }
    // There are multiple deep branches that can either throw or return; instead
    // of duplicating that deeply nested logic for the possible returns, DRY and
    // check for a return. This seems the least gnarly.
    var maybeReturn = checkIfDisallowedImport(specifier, parsed, parsedParentURL);
    if (maybeReturn) return maybeReturn;
    // This must come after checkIfDisallowedImport
    if (protocol === undefined && parsed) {
        protocol = parsed.protocol;
    }
    if (protocol === 'node:') {
        return {
            url: specifier
        };
    }
    // This must come after checkIfDisallowedImport
    if (parsed && parsed.protocol === 'node:') return {
        url: specifier
    };
    var conditions = (0, _utils.getConditionsSet)(context.conditions);
    var url = moduleResolve(specifier, new _nodeurl.URL(parentURL), conditions, false);
    return {
        // Do NOT cast `url` to a string: that will work even when there are real
        // problems, silencing them
        url: url.href,
        format: (0, _getformat.defaultGetFormatWithoutErrors)(url, {
            parentURL: parentURL
        })
    };
}
