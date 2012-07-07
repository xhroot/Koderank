


/** @interface */
var CodeMirror = function() {};

//CodeMirror.prototype.fromTextArea = function() {};


/**
 * Build from TextArea.
 * @param {Element} textAreaElement TextArea to host editor.
 * @param {Object} args Object for configuration arguments.
 */
CodeMirror.fromTextArea = function(textAreaElement, args) {};


/**
 * Read the entire CodeMirror text.
 */
CodeMirror.prototype.getValue = function() {};


/**
 * Replace the entire CodeMirror text.
 * @param {string} text The text to place in the CodeMirror.
 */
CodeMirror.prototype.setValue = function(text) {};


/**
 * Key value configuration for CodeMirror.
 * @param {string} text The key.
 * @param {string} value The value.
 */
CodeMirror.prototype.setOption = function(text, value) {};



/** @interface */
var appengine = function() {};



/**
 * App Engine Channel API
 *
 * @param {string} token Unique id to establish channel to server.
 * @constructor
 */
appengine.Channel = function(token) {};


/**
 * @param {Object=} opt_handler function.
 */
appengine.Channel.prototype.open = function(opt_handler) {};



/** @interface */
var console = function() {};


/**
 * @param {string} str Log message.
 */
console.log = function(str) {};



/** @interface */
var Twilio = function() {};



/**
 * Twilio class
 * @constructor
 */
Twilio.Device = function() {};


/**
 * Twilio setup
 * @param {string} token JWT encoded token containing scope twilio capabilities.
 */
Twilio.Device.setup = function(token) {};


/**
 * Twilio function to execute when call comes in.
 * @param {Function} fn Function to execute on incoming call.
 */
Twilio.Device.incoming = function(fn) {};


/**
 * Twilio connect to call.
 * @param {Object} obj Map, call parameters, recipient.
 */
Twilio.Device.connect = function(obj) {};


/**
 * Twilio hangup current call.
 */
Twilio.Device.disconnectAll = function() {};
