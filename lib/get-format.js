// Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/7c3dce0/lib/internal/modules/esm/get_format.js>
// Last checked on: Apr 29, 2023.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "defaultGetFormatWithoutErrors", {
    enumerable: true,
    get: function() {
        return defaultGetFormatWithoutErrors;
    }
});
var _nodeurl = require("node:url");
var _packagejsonreader = require("./package-json-reader.js");
var _errors = require("./errors.js");
var ERR_UNKNOWN_FILE_EXTENSION = _errors.codes.ERR_UNKNOWN_FILE_EXTENSION;
var hasOwnProperty = {}.hasOwnProperty;
/** @type {Record<string, string>} */ var extensionFormatMap = {
    // @ts-expect-error: hush.
    __proto__: null,
    '.cjs': 'commonjs',
    '.js': 'module',
    '.json': 'json',
    '.mjs': 'module'
};
/**
 * @param {string | null} mime
 * @returns {string | null}
 */ function mimeToFormat(mime) {
    if (mime && /\s*(text|application)\/javascript\s*(;\s*charset=utf-?8\s*)?/i.test(mime)) return 'module';
    if (mime === 'application/json') return 'json';
    return null;
}
/**
 * @callback ProtocolHandler
 * @param {URL} parsed
 * @param {{parentURL: string, source?: Buffer}} context
 * @param {boolean} ignoreErrors
 * @returns {string | null | void}
 */ /**
 * @type {Record<string, ProtocolHandler>}
 */ var protocolHandlers = {
    // @ts-expect-error: hush.
    __proto__: null,
    'data:': getDataProtocolModuleFormat,
    'file:': getFileProtocolModuleFormat,
    'http:': getHttpProtocolModuleFormat,
    'https:': getHttpProtocolModuleFormat,
    'node:': function() {
        return 'builtin';
    }
};
/**
 * @param {URL} parsed
 */ function getDataProtocolModuleFormat(parsed) {
    var _ref = /^([^/]+\/[^;,]+)[^,]*?(;base64)?,/.exec(parsed.pathname) || [
        null,
        null,
        null
    ], mime = _ref[1];
    return mimeToFormat(mime);
}
/**
 * Returns the file extension from a URL.
 *
 * Should give similar result to
 * `require('node:path').extname(require('node:url').fileURLToPath(url))`
 * when used with a `file:` URL.
 *
 * @param {URL} url
 * @returns {string}
 */ function extname(url) {
    var pathname = url.pathname;
    var index = pathname.length;
    while(index--){
        var code = pathname.codePointAt(index);
        if (code === 47 /* `/` */ ) {
            return '';
        }
        if (code === 46 /* `.` */ ) {
            return pathname.codePointAt(index - 1) === 47 /* `/` */  ? '' : pathname.slice(index);
        }
    }
    return '';
}
/**
 * @type {ProtocolHandler}
 */ function getFileProtocolModuleFormat(url, _context, ignoreErrors) {
    var value = extname(url);
    if (value === '.js') {
        var packageType = (0, _packagejsonreader.getPackageType)(url);
        if (packageType !== 'none') {
            return packageType;
        }
        return 'commonjs';
    }
    if (value === '') {
        var packageType1 = (0, _packagejsonreader.getPackageType)(url);
        // Legacy behavior
        if (packageType1 === 'none' || packageType1 === 'commonjs') {
            return 'commonjs';
        }
        // Note: we don’t implement WASM, so we don’t need
        // `getFormatOfExtensionlessFile` from `formats`.
        return 'module';
    }
    var format = extensionFormatMap[value];
    if (format) return format;
    // Explicit undefined return indicates load hook should rerun format check
    if (ignoreErrors) {
        return undefined;
    }
    var filepath = (0, _nodeurl.fileURLToPath)(url);
    throw new ERR_UNKNOWN_FILE_EXTENSION(value, filepath);
}
function getHttpProtocolModuleFormat() {
// To do: HTTPS imports.
}
function defaultGetFormatWithoutErrors(url, context) {
    var protocol = url.protocol;
    if (!hasOwnProperty.call(protocolHandlers, protocol)) {
        return null;
    }
    return protocolHandlers[protocol](url, context, true) || null;
}
