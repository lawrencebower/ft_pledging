(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.app = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":3}],2:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    // Listen for ready state
    request.onreadystatechange = function handleLoad() {
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

},{"../core/buildFullPath":9,"../core/createError":10,"./../core/settle":14,"./../helpers/buildURL":18,"./../helpers/cookies":20,"./../helpers/isURLSameOrigin":23,"./../helpers/parseHeaders":25,"./../utils":27}],3:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Factory for creating new instances
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"./cancel/Cancel":4,"./cancel/CancelToken":5,"./cancel/isCancel":6,"./core/Axios":7,"./core/mergeConfig":13,"./defaults":16,"./helpers/bind":17,"./helpers/isAxiosError":22,"./helpers/spread":26,"./utils":27}],4:[function(require,module,exports){
'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;

},{}],5:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":4}],6:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],7:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  // Hook up interceptors middleware
  var chain = [dispatchRequest, undefined];
  var promise = Promise.resolve(config);

  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

},{"../helpers/buildURL":18,"./../utils":27,"./InterceptorManager":8,"./dispatchRequest":11,"./mergeConfig":13}],8:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":27}],9:[function(require,module,exports){
'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

},{"../helpers/combineURLs":19,"../helpers/isAbsoluteURL":21}],10:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":12}],11:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/isCancel":6,"../defaults":16,"./../utils":27,"./transformData":15}],12:[function(require,module,exports){
'use strict';

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code
    };
  };
  return error;
};

},{}],13:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  var valueFromConfig2Keys = ['url', 'method', 'data'];
  var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
  var defaultToConfig2Keys = [
    'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
    'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
    'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
    'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
    'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
  ];
  var directMergeKeys = ['validateStatus'];

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  }

  utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    }
  });

  utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

  utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      config[prop] = getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  utils.forEach(directMergeKeys, function merge(prop) {
    if (prop in config2) {
      config[prop] = getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      config[prop] = getMergedValue(undefined, config1[prop]);
    }
  });

  var axiosKeys = valueFromConfig2Keys
    .concat(mergeDeepPropertiesKeys)
    .concat(defaultToConfig2Keys)
    .concat(directMergeKeys);

  var otherKeys = Object
    .keys(config1)
    .concat(Object.keys(config2))
    .filter(function filterAxiosKeys(key) {
      return axiosKeys.indexOf(key) === -1;
    });

  utils.forEach(otherKeys, mergeDeepProperties);

  return config;
};

},{"../utils":27}],14:[function(require,module,exports){
'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

},{"./createError":10}],15:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn(data, headers);
  });

  return data;
};

},{"./../utils":27}],16:[function(require,module,exports){
(function (process){(function (){
'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

var defaults = {
  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this)}).call(this,require('_process'))
},{"./adapters/http":2,"./adapters/xhr":2,"./helpers/normalizeHeaderName":24,"./utils":27,"_process":32}],17:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],18:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":27}],19:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],20:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":27}],21:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};

},{}],22:[function(require,module,exports){
'use strict';

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return (typeof payload === 'object') && (payload.isAxiosError === true);
};

},{}],23:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":27}],24:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":27}],25:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":27}],26:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],27:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');

/*global toString:true*/

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return (typeof FormData !== 'undefined') && (val instanceof FormData);
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (toString.call(val) !== '[object Object]') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM
};

},{"./helpers/bind":17}],28:[function(require,module,exports){
'use strict';

function leadZero(n, targetLength) {
    if (targetLength === void 0) { targetLength = 2; }
    var output = n + '';
    while (output.length < targetLength) {
        output = '0' + output;
    }
    return output;
}
function absFloor(num) {
    if (num < 0) {
        // -0 -> 0
        return Math.ceil(num) || 0;
    }
    else {
        return Math.floor(num);
    }
}
function extend(obj1, obj2) {
    var result = {};
    for (var key in obj1) {
        result[key] = obj1[key];
    }
    for (var key in obj2) {
        result[key] = obj2[key];
    }
    return result;
}
function tokensRx(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    keys.sort(function (a, b) { return b.length - a.length; });
    return new RegExp(keys.join('|') + '|\\[[^[]*\\]|.', 'g');
}
function formatTimezone(offset, delimiter) {
    var sign = offset > 0 ? '-' : '+';
    var absOffset = Math.abs(offset);
    var hours = Math.floor(absOffset / 60);
    var minutes = absOffset % 60;
    return sign + leadZero(hours) + delimiter + leadZero(minutes);
}

/**
 * Adds a number of milliseconds to date
 */
function addMilliseconds(date, milliseconds) {
    if (date === null)
        return null;
    if (!isFinite(milliseconds))
        return date;
    return new Date(date.getTime() + milliseconds);
}
/**
 * Adds a number of seconds to date
 */
function addSeconds(date, seconds) {
    if (date === null)
        return null;
    if (!isFinite(seconds))
        return date;
    return new Date(date.getTime() + 1000 /* Seconds */ * seconds);
}
/**
 * Adds a number of minutes to date
 */
function addMinutes(date, minutes) {
    if (date === null)
        return null;
    if (!isFinite(minutes))
        return date;
    return new Date(date.getTime() + 60000 /* Minutes */ * minutes);
}
/**
 * Adds a number of hours to date
 */
function addHours(date, hours) {
    if (date === null)
        return null;
    if (!isFinite(hours))
        return date;
    return new Date(date.getTime() + 3600000 /* Hours */ * hours);
}
/**
 * Adds a number of days to date
 */
function addDate(date, days) {
    if (date === null)
        return null;
    if (!isFinite(days))
        return date;
    var result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
}
/**
 * Adds a number of months to date
 */
function addMonth(date, months) {
    if (date === null)
        return null;
    if (!isFinite(months))
        return date;
    var result = new Date(date.getTime());
    result.setMonth(result.getMonth() + months);
    return result;
}
/**
 * Adds a number of years to date
 */
function addYear(date, years) {
    if (date === null)
        return null;
    if (!isFinite(years))
        return date;
    var result = new Date(date.getTime());
    result.setFullYear(result.getFullYear() + years);
    return result;
}

var START_OF_ISO_WEEK = 1;
function resetYear(d) {
    if (d === null)
        return null;
    return new Date(d.getFullYear(), 0);
}
function resetMonth(d) {
    if (d === null)
        return null;
    return new Date(d.getFullYear(), d.getMonth(), 1);
}
function resetISOWeek(d) {
    if (d === null)
        return null;
    var day = d.getDay();
    var diff = (day < START_OF_ISO_WEEK ? 7 : 0) + day - START_OF_ISO_WEEK;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff);
}
function resetDate(d) {
    if (d === null)
        return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function resetHours(d) {
    if (d === null)
        return null;
    var result = new Date(d.getTime());
    result.setMinutes(0, 0, 0);
    return result;
}
function resetMinutes(d) {
    if (d === null)
        return null;
    var result = new Date(d.getTime());
    result.setSeconds(0, 0);
    return result;
}
function resetSeconds(d) {
    if (d === null)
        return null;
    var result = new Date(d.getTime());
    result.setMilliseconds(0);
    return result;
}

/**
 * Type guard for ValidDate
 */
function isValidDate(d) {
    return d !== null && d instanceof Date && isFinite(d.getTime());
}
/**
 * Converts to the `ValidDate`, creating new instance of Date
 * @deprecated consider use of `isValidDate`
 */
function fromDate(date) {
    var d = new Date(+date);
    return asValidDateOrNull(d);
}
/**
 * Converts to the `ValidDate`, creating new instance of Date
 * @throws Will throw TypeError if input not a valid Date or timestamp
 * @deprecated Consider use of `isValidDate`
 */
function fromDateOrThrow(date) {
    var d = new Date(date instanceof Date ? date.getTime() : date);
    return asValidDateOrThrow(d, date);
}
function asValidDateOrNull(date) {
    if (isValidDate(date))
        return date;
    return null;
}
function asValidDateOrThrow(date, origin) {
    if (isValidDate(date))
        return date;
    throw new TypeError("Cant parse date from \"" + origin + "\"");
}
function newValidDate() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var dateArgs = [undefined];
    for (var i = 0; i < arguments.length; i++) {
        dateArgs[i + 1] = arguments[i];
    }
    var result = new (Date.bind.apply(Date, dateArgs))();
    return asValidDateOrNull(result);
}
function newValidDateOrThrow() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var dateArgs = [undefined];
    for (var i = 0; i < arguments.length; i++) {
        dateArgs[i + 1] = arguments[i];
    }
    var result = new (Date.bind.apply(Date, dateArgs))();
    return asValidDateOrThrow(result, dateArgs);
}

/**
 * The number of milliseconds between two dates
 * @example
 * diffMilliseconds(parseIso('2020-01-02'), parseIso('2020-01-01')) // 86400000 = milliseconds in one day
 */
function diffMilliseconds(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return absFloor(d1.getTime() - d2.getTime());
}
/**
 * The number of seconds between two dates
 * @example
 * diffSeconds(parseIso('2020-01-02'), parseIso('2020-01-01')) // 86400 = seconds in one day
 */
function diffSeconds(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return absFloor((d1.getTime() - d2.getTime()) / 1000 /* Seconds */);
}
/**
 * The number of minutes between two dates
 * @example
 * diffMinutes(parseIso('2020-01-02'), parseIso('2020-01-01')) // 1440 = minutes in one day
 * diffMinutes(parseIso('2020-01-01T12:30:01'), parseIso('2020-01-01T12:31:00')) // 0 = only 59 seconds left
 */
function diffMinutes(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return absFloor((d1.getTime() - d2.getTime()) / 60000 /* Minutes */);
}
function diffHours(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return absFloor((d1.getTime() - d2.getTime()) / 3600000 /* Hours */);
}
function dateToArray(d) {
    return [
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds(),
    ];
}
function compareArrays(list1, list2, fromPosition) {
    for (var i = fromPosition; i < list1.length; i++) {
        if (list1[i] === list2[i])
            continue;
        return list1[i] > list2[i] ? 1 : -1;
    }
    return 0;
}
function diffDate(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    var utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    var utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    var diff = absFloor((utc1 - utc2) / 86400000 /* Date */);
    if (diff === 0)
        return 0;
    var diffTail = compareArrays(dateToArray(d1), dateToArray(d2), 3);
    if (diffTail === 0 || diff > 0 === diffTail > 0)
        return diff;
    return diff + diffTail;
}
function diffMonth(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    var diff = (d1.getFullYear() - d2.getFullYear()) * 12 + d1.getMonth() - d2.getMonth();
    if (diff === 0)
        return 0;
    var diffTail = compareArrays(dateToArray(d1), dateToArray(d2), 2);
    if (diffTail === 0 || diff > 0 === diffTail > 0)
        return diff;
    return diff + diffTail;
}
function diffYear(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    var diff = d1.getFullYear() - d2.getFullYear();
    if (diff === 0)
        return 0;
    var diffTail = compareArrays(dateToArray(d1), dateToArray(d2), 1);
    if (!diffTail || diff > 0 === diffTail > 0)
        return diff;
    return diff + diffTail;
}

/**
 * Returns the number of years between two dates.
 * Months, days and time are ignored
 * @example
 * diffCalendarYear(parseIso('2020-01-01'), parseIso('2019-12-31')) // 1 = 2020 - 2019
 */
function diffCalendarYear(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return d1.getFullYear() - d2.getFullYear();
}
/**
 * Returns the number of months between two dates.
 * Days and time are ignored
 * @example
 * diffCalendarMonth(parseIso('2020-05-01'), parseIso('2020-03-31')) // 2 = 5 - 3
 */
function diffCalendarMonth(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return (d1.getFullYear() - d2.getFullYear()) * 12 + d1.getMonth() - d2.getMonth();
}
/**
 * Returns the number of days between two dates.
 * Time is ignored
 * @example
 * diffCalendarDate(parseIso('2020-05-01'), parseIso('2020-04-20')) // 11 = 10 days in april and 1 in march
 */
function diffCalendarDate(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    var u1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
    var u2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
    return absFloor((u1 - u2) / 86400000 /* Date */);
}

function diffPreciseSeconds(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return (d1.getTime() - d2.getTime()) / 1000 /* Seconds */;
}
function diffPreciseMinutes(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return (d1.getTime() - d2.getTime()) / 60000 /* Minutes */;
}
function diffPreciseHours(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return (d1.getTime() - d2.getTime()) / 3600000 /* Hours */;
}
function diffPreciseDate(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    return (d1.getTime() - d2.getTime()) / 86400000 /* Date */;
}
function diffPreciseMonth(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    var startOfMonth1 = +new Date(d1.getFullYear(), d1.getMonth());
    var startOfNextMonth1 = +new Date(d1.getFullYear(), d1.getMonth() + 1);
    var startOfMonth2 = +new Date(d2.getFullYear(), d2.getMonth());
    var startOfNextMonth2 = +new Date(d2.getFullYear(), d2.getMonth() + 1);
    var m1 = startOfNextMonth1 - startOfMonth1;
    var m2 = startOfNextMonth2 - startOfMonth2;
    var t1 = d1.getTime() - startOfMonth1;
    var t2 = d2.getTime() - startOfMonth2;
    /**
     * that formula was made to avoid "1 - 0.9" calculations
     * do same thing as
     * diffCalendarMonth(d1, d2) + t1 / m1 - t2 / m2
     */
    return (diffCalendarMonth(d1, d2) * m1 * m2 + t1 * m2 - t2 * m1) / (m1 * m2);
}
function diffPreciseYear(d1, d2) {
    if (!isValidDate(d1) || !isValidDate(d2))
        return null;
    var startOfYear1 = +new Date(d1.getFullYear(), 0);
    var startOfNextYear1 = +new Date(d1.getFullYear() + 1, 0);
    var startOfYear2 = +new Date(d2.getFullYear(), 0);
    var startOfNextYear2 = +new Date(d2.getFullYear() + 1, 0);
    var y1 = startOfNextYear1 - startOfYear1;
    var y2 = startOfNextYear2 - startOfYear2;
    var t1 = d1.getTime() - startOfYear1;
    var t2 = d2.getTime() - startOfYear2;
    return (diffCalendarYear(d1, d2) * y1 * y2 + t1 * y2 - t2 * y1) / (y1 * y2);
}

// YYYY-MM-DD
function formatDateIso(date) {
    if (!isValidDate(date))
        return null;
    return leadZero(date.getFullYear(), 4) + '-' + leadZero(date.getMonth() + 1) + '-' + leadZero(date.getDate());
}
// YYYY-MM-DDTHH:mm
function formatDateTimeIso(date) {
    if (!isValidDate(date))
        return null;
    return formatDateIso(date) + 'T' + leadZero(date.getHours()) + ':' + leadZero(date.getMinutes());
}
// YYYY-MM-DDTHH:mm:ss.SSS
function formatLocalIso(date) {
    if (!isValidDate(date))
        return null;
    return formatDateTimeIso(date) + ':' + leadZero(date.getSeconds()) + '.' + leadZero(date.getMilliseconds(), 3);
}

function toNumber(value, defaultValue) {
    return typeof value === 'undefined' ? defaultValue : +value;
}
function toNumberMs(value) {
    return typeof value === 'undefined' ? 0 : +value.substring(0, 4) * 1000;
}
//                  (    YYYY     )     ( MM )       ( DD )      ( HH )  ( MM )     ( SS )(  MS )   (      TZD            )
var ISO_RX = /^\s*([+-]?\d{4,6}?)(?:-?(\d\d))?(?:-?(\d\d))?(?:T(\d\d):?(\d\d):?(?:(\d\d)(\.\d+)?)?([+-]\d\d?(?::\d\d)?|Z)?)?\s*$/;
function parseIso(dateStr) {
    if (!dateStr)
        return null;
    var timeList = dateStr.match(ISO_RX);
    if (!timeList)
        return null;
    var Y = +timeList[1];
    var M = toNumber(timeList[2], 1) - 1;
    var D = toNumber(timeList[3], 1);
    var maybeResult = new Date(Y, M, D);
    if (Y <= 99 && Y >= 0) {
        maybeResult.setFullYear(Y);
    }
    var isDateOk = maybeResult.getDate() === D && maybeResult.getMonth() === M && maybeResult.getFullYear() === Y;
    if (!isDateOk)
        return null;
    if (!timeList[4])
        return maybeResult;
    var H = toNumber(timeList[4], 0);
    var m = toNumber(timeList[5], 0);
    var s = toNumber(timeList[6], 0);
    var ms = toNumberMs(timeList[7]);
    var isTimeOk = H < 24 && m < 60 && s < 60;
    if (!isTimeOk)
        return null;
    var tzd = timeList[8];
    if (tzd === 'Z') {
        maybeResult.setUTCFullYear(Y, M, D);
        maybeResult.setUTCHours(H, m, s, ms);
    }
    else if (tzd) {
        var tzdList = tzd.split(':');
        var tzH = toNumber(tzdList[0], 0);
        var tzM = (tzd[0] === '-' ? -1 : 1) * toNumber(tzdList[1], 0);
        var isTzOk = tzH > -24 && tzH < 24 && tzM < 60;
        if (!isTzOk)
            return null;
        maybeResult.setUTCFullYear(Y, M, D);
        maybeResult.setUTCHours(H - tzH, m - tzM, s, ms);
    }
    else {
        maybeResult.setHours(H, m, s, ms);
    }
    return maybeResult;
}
function parseIsoOrThrow(dateStr) {
    var result = parseIso(dateStr);
    if (result === null)
        throw new Error("Failed to parse as ISO 8601 string: \"" + dateStr + "\"");
    return result;
}

function splitToTokens(template, formatters) {
    var RX_TOKENS = /*@__PURE__*/ tokensRx(formatters);
    var tokens = template.match(RX_TOKENS);
    // this regexp cant fail because of "|."
    var result = [];
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var tokenFn = formatters[token];
        if (tokenFn) {
            result.push(tokenFn);
        }
        else if (token.charAt(0) === '[' && token.charAt(token.length - 1) === ']') {
            result.push(token.substring(1, token.length - 1));
        }
        else {
            result.push(token);
        }
    }
    return result;
}
function formatByTokens(d, tokens) {
    var result = [];
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        result.push(typeof token === 'function' ? token(d, i, tokens) : token);
    }
    return result.join('');
}
function createFormat(formatters) {
    var cache = {};
    return function (d, template) {
        if (!isValidDate(d))
            return null;
        var tokens = cache[template];
        if (tokens === undefined) {
            tokens = splitToTokens(template, formatters);
            cache[template] = tokens;
        }
        return formatByTokens(d, tokens);
    };
}
function createCustomFormatFn(formatters) {
    return function (customFormatters) {
        return createFormat(extend(formatters, customFormatters));
    };
}

function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
function createParse(parsers) {
    var RX_TOKENS = /*@__PURE__*/ tokensRx(parsers);
    return function parse(dateStr, template) {
        var tokens = template.match(RX_TOKENS);
        // this regexp cant fail because of "|."
        var parsersFn = [];
        var rxStr = tokens
            .map(function (token) {
            var parser = parsers[token];
            if (parser) {
                parsersFn.push(parser[1]);
                var regexpPart = parser[0];
                return "(" + regexpPart + ")";
            }
            if (token.charAt(0) === '[' && token.charAt(token.length - 1) === ']')
                token = token.substring(1, token.length - 1);
            return escapeRegExp(token);
        })
            .join('');
        var rx = new RegExp('^' + rxStr + '$', 'i');
        var values = dateStr.match(rx);
        if (!values)
            return null;
        /* NOTE second zero needed to set current timezone */
        var date = new Date(2000, 0);
        values.slice(1).forEach(function (value, index) {
            var parserFn = parsersFn[index];
            parserFn(date, value);
        });
        return asValidDateOrNull(date);
    };
}
function parseOrThrowWrapper(fn) {
    return function parseOrThrow(dateStr, template) {
        var result = fn(dateStr, template);
        if (result === null)
            throw new Error("Failed to parse date \"" + dateStr + "\" by template \"" + template + "\"");
        return result;
    };
}

var defaultFormatters = {
    // Month: 1, 2, ..., 12
    M: function (date) { return date.getMonth() + 1; },
    // Month: 01, 02, ..., 12
    MM: function (date) { return leadZero(date.getMonth() + 1); },
    // Quarter: 1, 2, 3, 4
    Q: function (date) { return Math.ceil((date.getMonth() + 1) / 3); },
    // Day of month: 1, 2, ..., 31
    D: function (date) { return date.getDate(); },
    // Day of month: 01, 02, ..., 31
    DD: function (date) { return leadZero(date.getDate()); },
    // Day of year: 1, 2, ..., 366
    DDD: function (date) { return diffCalendarDate(date, resetYear(date)) + 1; },
    // Day of year: 001, 002, ..., 366
    DDDD: function (date) { return leadZero(defaultFormatters['DDD'](date), 3); },
    // Day of week: 0, 1, ..., 6
    d: function (date) { return date.getDay(); },
    // Day of ISO week: 1, 2, ..., 7
    E: function (date) { return date.getDay() || 7; },
    // ISO week: 1, 2, ..., 53
    W: function (date) {
        var isoYear = +defaultFormatters['GGGG'](date);
        var start = resetISOWeek(newValidDateOrThrow(isoYear, 0, 4));
        return Math.floor(diffCalendarDate(date, start) / 7) + 1;
    },
    // ISO week: 01, 02, ..., 53
    WW: function (date) { return leadZero(defaultFormatters['W'](date)); },
    // Year: 00, 01, ..., 99
    YY: function (date) { return date.getFullYear().toString().slice(-2); },
    // Year: 1900, 1901, ..., 2099
    YYYY: function (date) { return leadZero(date.getFullYear(), 4); },
    // ISO week-numbering year: 00, 01, ..., 99
    GG: function (date) { return defaultFormatters['GGGG'](date).toString().slice(-2); },
    // ISO week-numbering year: 1900, 1901, ..., 2099
    GGGG: function (date) {
        var startYear = date.getFullYear();
        var correction = date < resetISOWeek(newValidDateOrThrow(startYear, 0, 4))
            ? -1
            : date < resetISOWeek(newValidDateOrThrow(startYear + 1, 0, 4))
                ? 0
                : 1;
        return leadZero(startYear + correction, 4);
    },
    // Hour: 0, 1, ... 23
    H: function (date) { return date.getHours(); },
    // Hour: 00, 01, ..., 23
    HH: function (date) { return leadZero(date.getHours()); },
    // Hour: 1, 2, ..., 12
    h: function (date) { return date.getHours() % 12 || 12; },
    // Hour: 01, 02, ..., 12
    hh: function (date) { return leadZero(defaultFormatters['h'](date)); },
    // Minute: 0, 1, ..., 59
    m: function (date) { return date.getMinutes(); },
    // Minute: 00, 01, ..., 59
    mm: function (date) { return leadZero(date.getMinutes()); },
    // Second: 0, 1, ..., 59
    s: function (date) { return date.getSeconds(); },
    // Second: 00, 01, ..., 59
    ss: function (date) { return leadZero(date.getSeconds()); },
    // 1/10 of second: 0, 1, ..., 9
    S: function (date) { return Math.floor(date.getMilliseconds() / 100); },
    // 1/100 of second: 00, 01, ..., 99
    SS: function (date) { return leadZero(Math.floor(date.getMilliseconds() / 10)); },
    // Millisecond: 000, 001, ..., 999
    SSS: function (date) { return leadZero(date.getMilliseconds(), 3); },
    // Timezone: -01:00, +00:00, ... +12:00
    Z: function (date) { return formatTimezone(date.getTimezoneOffset(), ':'); },
    // Timezone: -0100, +0000, ... +1200
    ZZ: function (date) { return formatTimezone(date.getTimezoneOffset(), ''); },
    // Seconds timestamp: 512969520
    X: function (date) { return Math.floor(date.getTime() / 1000); },
    // Milliseconds timestamp: 512969520900
    x: function (date) { return date.getTime(); },
};

var rx1 = '\\d';
var rx2 = '\\d\\d';
var rx12 = '\\d\\d?';
var rx3 = '\\d{3}';
var rx4 = '\\d{4}';
var rxN = '\\d{5,}';
var defaultParsers = {
    // Month: 1, 2, ..., 12
    M: [
        rx12,
        function (date, value) {
            date.setMonth(+value - 1);
        },
    ],
    // Month: 01, 02, ..., 12
    MM: [
        rx2,
        function (date, value) {
            date.setMonth(+value - 1);
        },
    ],
    // Quarter: 1, 2, 3, 4
    // 'Q': (date, value) => Math.ceil((date.getMonth() + 1) / 3),
    // Day of month: 1, 2, ..., 31
    D: [
        rx12,
        function (date, value) {
            date.setDate(+value);
        },
    ],
    // Day of month: 01, 02, ..., 31
    DD: [
        rx2,
        function (date, value) {
            date.setDate(+value);
        },
    ],
    // Day of year: 1, 2, ..., 366
    // TODO 'DDD': (date, value) => getDayOfYear(date),
    // Day of year: 001, 002, ..., 366
    // TODO 'DDDD': (date, value) => leadZero(getDayOfYear(date), 3),
    // Day of week: 0, 1, ..., 6
    // 'd': (date, value) => date.getDay(),
    // Day of ISO week: 1, 2, ..., 7
    // 'E': (date, value) => date.getDay() || 7,
    // ISO week: 1, 2, ..., 53
    // TODO 'W': (date, value) => getISOWeek(date),
    // ISO week: 01, 02, ..., 53
    // TODO 'WW': (date, value) => leadZero(getISOWeek(date)),
    // Year: 00, 01, ..., 99
    YY: [
        rx2,
        function (date, value) {
            date.setFullYear(2000 + +value);
        },
    ],
    // Year: 1900, 1901, ..., 2099
    YYYY: [
        rx4,
        function (date, value) {
            date.setFullYear(+value);
        },
    ],
    // ISO week-numbering year: 00, 01, ..., 99
    // TODO 'GG': (date, value) => getISOYear(date).toString().slice(-2),
    // ISO week-numbering year: 1900, 1901, ..., 2099
    // TODO 'GGGG': (date, value) => getISOYear(date),
    // Hour: 0, 1, ... 23
    H: [
        rx12,
        function (date, value) {
            date.setHours(+value);
        },
    ],
    // Hour: 00, 01, ..., 23
    HH: [
        rx2,
        function (date, value) {
            date.setHours(+value);
        },
    ],
    // Hour: 1, 2, ..., 12
    //'h': (date, value) => (date.getHours() % 12) || 12,
    // Hour: 01, 02, ..., 12
    // 'hh': (date, value) => leadZero(formatters['h'](date)),
    // Minute: 0, 1, ..., 59
    m: [
        rx12,
        function (date, value) {
            date.setMinutes(+value);
        },
    ],
    // Minute: 00, 01, ..., 59
    mm: [
        rx2,
        function (date, value) {
            date.setMinutes(+value);
        },
    ],
    // Second: 0, 1, ..., 59
    s: [
        rx12,
        function (date, value) {
            date.setSeconds(+value);
        },
    ],
    // Second: 00, 01, ..., 59
    ss: [
        rx2,
        function (date, value) {
            date.setSeconds(+value);
        },
    ],
    // 1/10 of second: 0, 1, ..., 9
    S: [
        rx1,
        function (date, value) {
            date.setMilliseconds(+value * 100);
        },
    ],
    // 1/100 of second: 00, 01, ..., 99
    SS: [
        rx2,
        function (date, value) {
            date.setMilliseconds(+value * 10);
        },
    ],
    // Millisecond: 000, 001, ..., 999
    SSS: [
        rx3,
        function (date, value) {
            date.setMilliseconds(+value);
        },
    ],
    // Timezone: -01:00, +00:00, ... +12:00
    // TODO 'Z': (date, value) => formatTimezone(date.getTimezoneOffset(), ':'),
    // Timezone: -0100, +0000, ... +1200
    // TODO 'ZZ': (date, value) => formatTimezone(date.getTimezoneOffset()),
    // Seconds timestamp: 512969520
    X: [
        rxN,
        function (date, value) {
            date.setTime(+value * 1000);
        },
    ],
    // Milliseconds timestamp: 512969520900
    x: [
        rxN,
        function (date, value) {
            date.setTime(+value);
        },
    ],
};

exports.addDate = addDate;
exports.addHours = addHours;
exports.addMilliseconds = addMilliseconds;
exports.addMinutes = addMinutes;
exports.addMonth = addMonth;
exports.addSeconds = addSeconds;
exports.addYear = addYear;
exports.asValidDateOrNull = asValidDateOrNull;
exports.createCustomFormatFn = createCustomFormatFn;
exports.createFormat = createFormat;
exports.createParse = createParse;
exports.defaultFormatters = defaultFormatters;
exports.defaultParsers = defaultParsers;
exports.diffCalendarDate = diffCalendarDate;
exports.diffCalendarMonth = diffCalendarMonth;
exports.diffCalendarYear = diffCalendarYear;
exports.diffDate = diffDate;
exports.diffHours = diffHours;
exports.diffMilliseconds = diffMilliseconds;
exports.diffMinutes = diffMinutes;
exports.diffMonth = diffMonth;
exports.diffPreciseDate = diffPreciseDate;
exports.diffPreciseHours = diffPreciseHours;
exports.diffPreciseMinutes = diffPreciseMinutes;
exports.diffPreciseMonth = diffPreciseMonth;
exports.diffPreciseSeconds = diffPreciseSeconds;
exports.diffPreciseYear = diffPreciseYear;
exports.diffSeconds = diffSeconds;
exports.diffYear = diffYear;
exports.extend = extend;
exports.formatDateIso = formatDateIso;
exports.formatDateTimeIso = formatDateTimeIso;
exports.formatLocalIso = formatLocalIso;
exports.fromDate = fromDate;
exports.fromDateOrThrow = fromDateOrThrow;
exports.isValidDate = isValidDate;
exports.newValidDate = newValidDate;
exports.newValidDateOrThrow = newValidDateOrThrow;
exports.parseIso = parseIso;
exports.parseIsoOrThrow = parseIsoOrThrow;
exports.parseOrThrowWrapper = parseOrThrowWrapper;
exports.resetDate = resetDate;
exports.resetHours = resetHours;
exports.resetISOWeek = resetISOWeek;
exports.resetMinutes = resetMinutes;
exports.resetMonth = resetMonth;
exports.resetSeconds = resetSeconds;
exports.resetYear = resetYear;

},{}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var defaultParsers = require('./default-parsers-1fb44fcb.js');

var commonFormatters = defaultParsers.extend({}, defaultParsers.defaultFormatters);
/**
 * format without any locale, just numbers
 */
var format = defaultParsers.createFormat(commonFormatters);
/**
 * extending common formatters with your own
 */
function extendFormat(formatters) {
    for (var key in formatters) {
        commonFormatters[key] = formatters[key];
    }
}

/**
 * parse without any locale, just numbers
 */
var parse = defaultParsers.createParse(defaultParsers.defaultParsers);
var parseOrThrow = defaultParsers.parseOrThrowWrapper(parse);

exports.addDate = defaultParsers.addDate;
exports.addHours = defaultParsers.addHours;
exports.addMilliseconds = defaultParsers.addMilliseconds;
exports.addMinutes = defaultParsers.addMinutes;
exports.addMonth = defaultParsers.addMonth;
exports.addSeconds = defaultParsers.addSeconds;
exports.addYear = defaultParsers.addYear;
exports.asValidDateOrNull = defaultParsers.asValidDateOrNull;
exports.diffCalendarDate = defaultParsers.diffCalendarDate;
exports.diffCalendarMonth = defaultParsers.diffCalendarMonth;
exports.diffCalendarYear = defaultParsers.diffCalendarYear;
exports.diffDate = defaultParsers.diffDate;
exports.diffHours = defaultParsers.diffHours;
exports.diffMilliseconds = defaultParsers.diffMilliseconds;
exports.diffMinutes = defaultParsers.diffMinutes;
exports.diffMonth = defaultParsers.diffMonth;
exports.diffPreciseDate = defaultParsers.diffPreciseDate;
exports.diffPreciseHours = defaultParsers.diffPreciseHours;
exports.diffPreciseMinutes = defaultParsers.diffPreciseMinutes;
exports.diffPreciseMonth = defaultParsers.diffPreciseMonth;
exports.diffPreciseSeconds = defaultParsers.diffPreciseSeconds;
exports.diffPreciseYear = defaultParsers.diffPreciseYear;
exports.diffSeconds = defaultParsers.diffSeconds;
exports.diffYear = defaultParsers.diffYear;
exports.formatDateIso = defaultParsers.formatDateIso;
exports.formatDateTimeIso = defaultParsers.formatDateTimeIso;
exports.formatLocalIso = defaultParsers.formatLocalIso;
exports.fromDate = defaultParsers.fromDate;
exports.fromDateOrThrow = defaultParsers.fromDateOrThrow;
exports.isValidDate = defaultParsers.isValidDate;
exports.newValidDate = defaultParsers.newValidDate;
exports.newValidDateOrThrow = defaultParsers.newValidDateOrThrow;
exports.parseIso = defaultParsers.parseIso;
exports.parseIsoOrThrow = defaultParsers.parseIsoOrThrow;
exports.resetDate = defaultParsers.resetDate;
exports.resetHours = defaultParsers.resetHours;
exports.resetISOWeek = defaultParsers.resetISOWeek;
exports.resetMinutes = defaultParsers.resetMinutes;
exports.resetMonth = defaultParsers.resetMonth;
exports.resetSeconds = defaultParsers.resetSeconds;
exports.resetYear = defaultParsers.resetYear;
exports.extendFormat = extendFormat;
exports.format = format;
exports.parse = parse;
exports.parseOrThrow = parseOrThrow;

},{"./default-parsers-1fb44fcb.js":28}],30:[function(require,module,exports){
exports.debounce=function(e,r,n){var i,o,t;void 0===r&&(r=50),void 0===n&&(n={});var a=null!=(i=n.isImmediate)&&i,u=null!=(o=n.callback)&&o,c=n.maxWait,v=Date.now(),l=[];function f(){if(void 0!==c){var e=Date.now()-v;if(e+r>=c)return c-e}return r}var d=function(){var r=[].slice.call(arguments),n=this;return new Promise(function(i,o){var c=a&&void 0===t;if(void 0!==t&&clearTimeout(t),t=setTimeout(function(){if(t=void 0,v=Date.now(),!a){var i=e.apply(n,r);u&&u(i),l.forEach(function(e){return(0,e.resolve)(i)}),l=[]}},f()),c){var d=e.apply(n,r);return u&&u(d),i(d)}l.push({resolve:i,reject:o})})};return d.cancel=function(e){void 0!==t&&clearTimeout(t),l.forEach(function(r){return(0,r.reject)(e)}),l=[]},d};


},{}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const ts_debounce_1 = require("ts-debounce");
const ts_date_1 = require("ts-date");
class Caller {
    constructor() {
        this.caller = (user, pledge) => this.makePledge(user, pledge);
        this.bouncy = ts_debounce_1.debounce(this.caller, 250, { isImmediate: false });
        this.user = "not_set";
        this.totalPledge = 0;
        this.newPledge = 0;
        this.tempTotalPledge = 0;
    }
    setup() {
        this.giveButton = document.getElementById("giveButton");
        this.takeButton = document.getElementById("takeButton");
        this.pledgeDiv = document.getElementById("pledgeDiv");
        this.messageDiv = document.getElementById("messageDiv");
        let nameInput = document.getElementById("hidden_name_field");
        this.user = nameInput.value;
        this.giveButton.addEventListener("click", (event) => {
            this.pledge(100);
        });
        this.takeButton.addEventListener("click", (event) => {
            this.pledge(-100);
        });
    }
    pledge(pledge) {
        this.newPledge += pledge;
        console.log(this.newPledge);
        this.tempTotalPledge = this.totalPledge + this.newPledge;
        this.pledgeDiv.innerText = String(this.tempTotalPledge);
        this.bouncy(this.user, this.newPledge);
    }
    makePledge(user, pledge) {
        let callString = `http://192.168.0.21:8080/pledge?pledge=${pledge}&name=${user}`;
        axios_1.default.get(callString)
            .then(response => this.dealWith(response))
            .catch(error => this.error(error))
            .then(() => this.default());
    }
    dealWith(response) {
        console.log(response.data);
        this.totalPledge = this.tempTotalPledge;
        this.tempTotalPledge = 0;
        this.newPledge = 0;
        this.messageDiv.innerText = `Pledge saved (${this.getDateString()})`;
        this.pledgeDiv.innerText = String(this.totalPledge);
    }
    error(error) {
        console.log(error);
        this.messageDiv.innerText = `error! (${this.getDateString()})`;
    }
    default() {
        console.log("default");
    }
    getDateString() {
        let date = new Date();
        return ts_date_1.format(date, "HH:mm:ss");
    }
}
// new Caller().run()
window.onload = function (e) {
    new Caller().setup();
};

},{"axios":1,"ts-date":29,"ts-debounce":30}],32:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[31])(31)
});
