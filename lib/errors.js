/**
 * @typedef ErrnoExceptionFields
 * @property {number | undefined} [errnode]
 * @property {string | undefined} [code]
 * @property {string | undefined} [path]
 * @property {string | undefined} [syscall]
 * @property {string | undefined} [url]
 *
 * @typedef {Error & ErrnoExceptionFields} ErrnoException
 */ /**
 * @typedef {(...parameters: Array<any>) => string} MessageFunction
 */ // Manually “tree shaken” from:
// <https://github.com/nodejs/node/blob/45f5c9b/lib/internal/errors.js>
// Last checked on: Nov 2, 2023.
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "codes", {
    enumerable: true,
    get: function() {
        return codes;
    }
});
var _nodev8 = /*#__PURE__*/ _interop_require_default(require("node:v8"));
var _nodeassert = /*#__PURE__*/ _interop_require_default(require("node:assert"));
var _nodeurl = require("node:url");
var _nodeutil = require("node:util");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var own = {}.hasOwnProperty;
var classRegExp = /^([A-Z][a-z\d]*)+$/;
// Sorted by a rough estimate on most frequently used entries.
var kTypes = new Set([
    'string',
    'function',
    'number',
    'object',
    // Accept 'Function' and 'Object' as alternative to the lower cased version.
    'Function',
    'Object',
    'boolean',
    'bigint',
    'symbol'
]);
var codes = {};
/**
 * Create a list string in the form like 'A and B' or 'A, B, ..., and Z'.
 * We cannot use Intl.ListFormat because it's not available in
 * --without-intl builds.
 *
 * @param {Array<string>} array
 *   An array of strings.
 * @param {string} [type]
 *   The list type to be inserted before the last element.
 * @returns {string}
 */ function formatList(array) {
    var type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'and';
    return array.length < 3 ? array.join(" ".concat(type, " ")) : "".concat(array.slice(0, -1).join(', '), ", ").concat(type, " ").concat(array[array.length - 1]);
}
/** @type {Map<string, MessageFunction | string>} */ var messages = new Map();
var nodeInternalPrefix = '__node_internal_';
/** @type {number} */ var userStackTraceLimit;
codes.ERR_INVALID_ARG_TYPE = createError('ERR_INVALID_ARG_TYPE', /**
   * @param {string} name
   * @param {Array<string> | string} expected
   * @param {unknown} actual
   */ function(name, expected, actual) {
    (0, _nodeassert.default)(typeof name === 'string', "'name' must be a string");
    if (!Array.isArray(expected)) {
        expected = [
            expected
        ];
    }
    var message = 'The ';
    if (name.endsWith(' argument')) {
        // For cases like 'first argument'
        message += "".concat(name, " ");
    } else {
        var type = name.includes('.') ? 'property' : 'argument';
        message += '"'.concat(name, '" ').concat(type, " ");
    }
    message += 'must be ';
    /** @type {Array<string>} */ var types = [];
    /** @type {Array<string>} */ var instances = [];
    /** @type {Array<string>} */ var other = [];
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
    try {
        for(var _iterator = expected[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
            var value = _step.value;
            (0, _nodeassert.default)(typeof value === 'string', 'All expected entries have to be of type string');
            if (kTypes.has(value)) {
                types.push(value.toLowerCase());
            } else if (classRegExp.exec(value) === null) {
                (0, _nodeassert.default)(value !== 'object', 'The value "object" should be written as "Object"');
                other.push(value);
            } else {
                instances.push(value);
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally{
        try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
            }
        } finally{
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
    // Special handle `object` in case other instances are allowed to outline
    // the differences between each other.
    if (instances.length > 0) {
        var pos = types.indexOf('object');
        if (pos !== -1) {
            types.slice(pos, 1);
            instances.push('Object');
        }
    }
    if (types.length > 0) {
        message += "".concat(types.length > 1 ? 'one of type' : 'of type', " ").concat(formatList(types, 'or'));
        if (instances.length > 0 || other.length > 0) message += ' or ';
    }
    if (instances.length > 0) {
        message += "an instance of ".concat(formatList(instances, 'or'));
        if (other.length > 0) message += ' or ';
    }
    if (other.length > 0) {
        if (other.length > 1) {
            message += "one of ".concat(formatList(other, 'or'));
        } else {
            if (other[0].toLowerCase() !== other[0]) message += 'an ';
            message += "".concat(other[0]);
        }
    }
    message += ". Received ".concat(determineSpecificType(actual));
    return message;
}, TypeError);
codes.ERR_INVALID_MODULE_SPECIFIER = createError('ERR_INVALID_MODULE_SPECIFIER', /**
   * @param {string} request
   * @param {string} reason
   * @param {string} [base]
   */ function(request, reason) {
    var base = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : undefined;
    return 'Invalid module "'.concat(request, '" ').concat(reason).concat(base ? " imported from ".concat(base) : '');
}, TypeError);
codes.ERR_INVALID_PACKAGE_CONFIG = createError('ERR_INVALID_PACKAGE_CONFIG', /**
   * @param {string} path
   * @param {string} [base]
   * @param {string} [message]
   */ function(path, base, message) {
    return "Invalid package config ".concat(path).concat(base ? " while importing ".concat(base) : '').concat(message ? ". ".concat(message) : '');
}, Error);
codes.ERR_INVALID_PACKAGE_TARGET = createError('ERR_INVALID_PACKAGE_TARGET', /**
   * @param {string} packagePath
   * @param {string} key
   * @param {unknown} target
   * @param {boolean} [isImport=false]
   * @param {string} [base]
   */ function(packagePath, key, target) {
    var isImport = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : false, base = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : undefined;
    var relatedError = typeof target === 'string' && !isImport && target.length > 0 && !target.startsWith('./');
    if (key === '.') {
        (0, _nodeassert.default)(isImport === false);
        return 'Invalid "exports" main target '.concat(JSON.stringify(target), " defined ") + "in the package config ".concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '').concat(relatedError ? '; targets must start with "./"' : '');
    }
    return 'Invalid "'.concat(isImport ? 'imports' : 'exports', '" target ').concat(JSON.stringify(target), " defined for '").concat(key, "' in the package config ").concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '').concat(relatedError ? '; targets must start with "./"' : '');
}, Error);
codes.ERR_MODULE_NOT_FOUND = createError('ERR_MODULE_NOT_FOUND', /**
   * @param {string} path
   * @param {string} base
   * @param {boolean} [exactUrl]
   */ function(path, base) {
    var exactUrl = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
    return "Cannot find ".concat(exactUrl ? 'module' : 'package', " '").concat(path, "' imported from ").concat(base);
}, Error);
codes.ERR_NETWORK_IMPORT_DISALLOWED = createError('ERR_NETWORK_IMPORT_DISALLOWED', "import of '%s' by %s is not supported: %s", Error);
codes.ERR_PACKAGE_IMPORT_NOT_DEFINED = createError('ERR_PACKAGE_IMPORT_NOT_DEFINED', /**
   * @param {string} specifier
   * @param {string} packagePath
   * @param {string} base
   */ function(specifier, packagePath, base) {
    return 'Package import specifier "'.concat(specifier, '" is not defined').concat(packagePath ? " in package ".concat(packagePath, "package.json") : '', " imported from ").concat(base);
}, TypeError);
codes.ERR_PACKAGE_PATH_NOT_EXPORTED = createError('ERR_PACKAGE_PATH_NOT_EXPORTED', /**
   * @param {string} packagePath
   * @param {string} subpath
   * @param {string} [base]
   */ function(packagePath, subpath) {
    var base = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : undefined;
    if (subpath === '.') return 'No "exports" main defined in '.concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '');
    return "Package subpath '".concat(subpath, '\' is not defined by "exports" in ').concat(packagePath, "package.json").concat(base ? " imported from ".concat(base) : '');
}, Error);
codes.ERR_UNSUPPORTED_DIR_IMPORT = createError('ERR_UNSUPPORTED_DIR_IMPORT', "Directory import '%s' is not supported " + 'resolving ES modules imported from %s', Error);
codes.ERR_UNSUPPORTED_RESOLVE_REQUEST = createError('ERR_UNSUPPORTED_RESOLVE_REQUEST', 'Failed to resolve module specifier "%s" from "%s": Invalid relative URL or base scheme is not hierarchical.', TypeError);
codes.ERR_UNKNOWN_FILE_EXTENSION = createError('ERR_UNKNOWN_FILE_EXTENSION', /**
   * @param {string} extension
   * @param {string} path
   */ function(extension, path) {
    return 'Unknown file extension "'.concat(extension, '" for ').concat(path);
}, TypeError);
codes.ERR_INVALID_ARG_VALUE = createError('ERR_INVALID_ARG_VALUE', /**
   * @param {string} name
   * @param {unknown} value
   * @param {string} [reason='is invalid']
   */ function(name, value) {
    var reason = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'is invalid';
    var inspected = (0, _nodeutil.inspect)(value);
    if (inspected.length > 128) {
        inspected = "".concat(inspected.slice(0, 128), "...");
    }
    var type = name.includes('.') ? 'property' : 'argument';
    return "The ".concat(type, " '").concat(name, "' ").concat(reason, ". Received ").concat(inspected);
}, TypeError);
/**
 * Utility function for registering the error codes. Only used here. Exported
 * *only* to allow for testing.
 * @param {string} sym
 * @param {MessageFunction | string} value
 * @param {ErrorConstructor} constructor
 * @returns {new (...parameters: Array<any>) => Error}
 */ function createError(sym, value, constructor) {
    // Special case for SystemError that formats the error message differently
    // The SystemErrors only have SystemError as their base classes.
    messages.set(sym, value);
    return makeNodeErrorWithCode(constructor, sym);
}
/**
 * @param {ErrorConstructor} Base
 * @param {string} key
 * @returns {ErrorConstructor}
 */ function makeNodeErrorWithCode(Base, key) {
    // @ts-expect-error It’s a Node error.
    return NodeError;
    /**
   * @param {Array<unknown>} parameters
   */ function NodeError() {
        for(var _len = arguments.length, parameters = new Array(_len), _key = 0; _key < _len; _key++){
            parameters[_key] = arguments[_key];
        }
        var limit = Error.stackTraceLimit;
        if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = 0;
        var error = new Base();
        // Reset the limit and setting the name property.
        if (isErrorStackTraceLimitWritable()) Error.stackTraceLimit = limit;
        var message = getMessage(key, parameters, error);
        Object.defineProperties(error, {
            // Note: no need to implement `kIsNodeError` symbol, would be hard,
            // probably.
            message: {
                value: message,
                enumerable: false,
                writable: true,
                configurable: true
            },
            toString: {
                /** @this {Error} */ value: function value() {
                    return "".concat(this.name, " [").concat(key, "]: ").concat(this.message);
                },
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        captureLargerStackTrace(error);
        // @ts-expect-error It’s a Node error.
        error.code = key;
        return error;
    }
}
/**
 * @returns {boolean}
 */ function isErrorStackTraceLimitWritable() {
    // Do no touch Error.stackTraceLimit as V8 would attempt to install
    // it again during deserialization.
    try {
        if (_nodev8.default.startupSnapshot.isBuildingSnapshot()) {
            return false;
        }
    } catch (e) {}
    var desc = Object.getOwnPropertyDescriptor(Error, 'stackTraceLimit');
    if (desc === undefined) {
        return Object.isExtensible(Error);
    }
    return own.call(desc, 'writable') && desc.writable !== undefined ? desc.writable : desc.set !== undefined;
}
/**
 * This function removes unnecessary frames from Node.js core errors.
 * @template {(...parameters: unknown[]) => unknown} T
 * @param {T} wrappedFunction
 * @returns {T}
 */ function hideStackFrames(wrappedFunction) {
    // We rename the functions that will be hidden to cut off the stacktrace
    // at the outermost one
    var hidden = nodeInternalPrefix + wrappedFunction.name;
    Object.defineProperty(wrappedFunction, 'name', {
        value: hidden
    });
    return wrappedFunction;
}
var captureLargerStackTrace = hideStackFrames(/**
   * @param {Error} error
   * @returns {Error}
   */ // @ts-expect-error: fine
function(error) {
    var stackTraceLimitIsWritable = isErrorStackTraceLimitWritable();
    if (stackTraceLimitIsWritable) {
        userStackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = Number.POSITIVE_INFINITY;
    }
    Error.captureStackTrace(error);
    // Reset the limit
    if (stackTraceLimitIsWritable) Error.stackTraceLimit = userStackTraceLimit;
    return error;
});
/**
 * @param {string} key
 * @param {Array<unknown>} parameters
 * @param {Error} self
 * @returns {string}
 */ function getMessage(key, parameters, self) {
    var message = messages.get(key);
    (0, _nodeassert.default)(message !== undefined, 'expected `message` to be found');
    if (typeof message === 'function') {
        (0, _nodeassert.default)(message.length <= parameters.length, "Code: ".concat(key, "; The provided arguments length (").concat(parameters.length, ") does not ") + "match the required ones (".concat(message.length, ")."));
        return Reflect.apply(message, self, parameters);
    }
    var regex = /%[dfijoOs]/g;
    var expectedLength = 0;
    while(regex.exec(message) !== null)expectedLength++;
    (0, _nodeassert.default)(expectedLength === parameters.length, "Code: ".concat(key, "; The provided arguments length (").concat(parameters.length, ") does not ") + "match the required ones (".concat(expectedLength, ")."));
    if (parameters.length === 0) return message;
    parameters.unshift(message);
    return Reflect.apply(_nodeutil.format, null, parameters);
}
/**
 * Determine the specific type of a value for type-mismatch errors.
 * @param {unknown} value
 * @returns {string}
 */ function determineSpecificType(value) {
    if (value === null || value === undefined) {
        return String(value);
    }
    if (typeof value === 'function' && value.name) {
        return "function ".concat(value.name);
    }
    if ((typeof value === "undefined" ? "undefined" : _type_of(value)) === 'object') {
        if (value.constructor && value.constructor.name) {
            return "an instance of ".concat(value.constructor.name);
        }
        return "".concat((0, _nodeutil.inspect)(value, {
            depth: -1
        }));
    }
    var inspected = (0, _nodeutil.inspect)(value, {
        colors: false
    });
    if (inspected.length > 28) {
        inspected = "".concat(inspected.slice(0, 25), "...");
    }
    return "type ".concat(typeof value === "undefined" ? "undefined" : _type_of(value), " (").concat(inspected, ")");
}
