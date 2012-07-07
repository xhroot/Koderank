
goog.provide('kr.Dashboard');
goog.provide('kr.Dashboard.Light');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.events.EventTarget');



/**
 * Dashboard
 * @param {string} iconPath Path to icon images.
 * @param {kr.Dashboard.Light} candTypingLight DOM element for candidate typing.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
kr.Dashboard = function(iconPath, candTypingLight) {
  goog.events.EventTarget.call(this);

  this.iconPath_ = iconPath;

  /**
   * @type {kr.Dashboard.Light}
   * @private
   */
  this.candTypingLight_ = candTypingLight;
};
goog.inherits(kr.Dashboard, goog.events.EventTarget);


/**
 * Adjust candidate typing status;
 * @param {boolean} value 'true' to enable user edits, 'false' to disable.
 */
kr.Dashboard.prototype.setCandTypingLight = function(value) {
  var src = value ? this.candTypingLight_.onIcon :
      this.candTypingLight_.offIcon;

  goog.dom.setProperties(this.candTypingLight_.el,
      { 'src': this.iconPath_ + src });
};



/**
 * Dashboard light
 * @param {Element} el host DOM element.
 * @param {string} onIcon "on" icon image name.
 * @param {string} offIcon "off" icon image name.
 * @constructor
 */
kr.Dashboard.Light = function(el, onIcon, offIcon) {
  this.el = el;
  this.onIcon = onIcon;
  this.offIcon = offIcon;
};




