
goog.provide('kr.Editor');
goog.provide('kr.Editor.PauseEvent');

goog.require('goog.events');
goog.require('goog.events.EventTarget');
//goog.require('goog.events.KeyHandler');



/**
 * Creates code editing space.  Uses CodeMirror js library.
 * @param {HTMLTextAreaElement} hostElement DOM element to host CodeMirror.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
kr.Editor = function(hostElement) {
  goog.events.EventTarget.call(this);

  //` Possible to use Closure keybinding?
  var keyEvent = goog.bind(this.onKeyEvent, this);

  /** @private */
  this.codeMirror_ = CodeMirror.fromTextArea(hostElement, {
    'lineNumbers': true,
    'theme': 'default',
    'indentWithTabs': false,
    'onKeyEvent': keyEvent
  });

  /**
   * @type {boolean}
   * @private
   */
  this.canEdit_ = true;

  /**
   * Short pause timer for quick changes.
   * @type {?number}
   * @private
   */
  this.shortPauseTimerId_ = null;

  /**
   * Long pause timer for inactivity.
   * @type {?number}
   * @private
   */
  this.longPauseTimerId_ = null;

  /**
   * Saved snapshot of editor content.
   * @type {string}
   * @private
   */
  this.snapshotText_ = this.getFullText();
};
goog.inherits(kr.Editor, goog.events.EventTarget);


/**
 * Adjust editable status.  CodeMirror is editable by default.
 * @param {boolean} value 'true' to enable user edits, 'false' to disable.
 */
kr.Editor.prototype.setCanEdit = function(value) {
  this.canEdit_ = value;
  this.codeMirror_.setOption('readOnly', !this.canEdit_);
};


/**
 * Get current text.
 * @return {string} Current text.
 */
kr.Editor.prototype.getFullText = function() {
  return this.codeMirror_.getValue();
};


/**
 * Replace entire text in CodeMirror.
 * @param {string} text Replacement text.
 */
kr.Editor.prototype.setFullText = function(text) {
  this.codeMirror_.setValue(text);
};


/**
 * Handle key events in CodeMirror.
 * @param {CodeMirror} i CodeMirror instance.
 * @param {Event} e Replacement text.
 */
kr.Editor.prototype.onKeyEvent = function(i, e) {
  if (this.canEdit_ && e.type == 'keyup') {

    // Reset short pause timer. Prepare for patching on expiration.
    goog.Timer.clear(this.shortPauseTimerId_);
    var shortPause = goog.bind(this.publishShortPause_, this);
    this.shortPauseTimerId_ = goog.Timer.callOnce(shortPause, 100);

    // Reset long pause timer. Prepare full text on expiration.
    goog.Timer.clear(this.longPauseTimerId_);
    var longPause = goog.bind(this.publishLongPause, this);
    this.longPauseTimerId_ = goog.Timer.callOnce(longPause, 1500);
  }
};


/**
 * Send small pause observers the info for making a patch, if text changed.
 * @private
 */
kr.Editor.prototype.publishShortPause_ = function() {
  var currentText = this.getFullText();
  if (currentText != this.snapshotText_) {
    this.dispatchEvent(new kr.Editor.PauseEvent(
        kr.events.EventType.EDITOR_SHORT_PAUSE, currentText,
        this.snapshotText_));
    this.snapshotText_ = currentText;
  }
};


/** Send long pause observers the full text. */
kr.Editor.prototype.publishLongPause = function() {
  this.dispatchEvent(new kr.Editor.PauseEvent(
      kr.events.EventType.EDITOR_LONG_PAUSE, this.getFullText()));
};



/**
 * Event to send data on pause.
 * @param {kr.events.EventType} eventType Type of pause.
 * @param {string} currentText Current text.
 * @param {string=} opt_snapshotText Text after last patch.
 * @constructor
 * @extends {goog.events.Event}
 */
kr.Editor.PauseEvent = function(eventType, currentText, opt_snapshotText) {
  goog.events.Event.call(this, eventType);

  /** @private */
  this.currentText_ = currentText;

  /** @private */
  this.snapshotText_ = opt_snapshotText;
};
goog.inherits(kr.Editor.PauseEvent, goog.events.Event);


/** @return {string} get snapshot text. */
kr.Editor.PauseEvent.prototype.getSnapshotText = function() {
  return (this.snapshotText_) ? this.snapshotText_ : '';
};


/** @return {string} get current text. */
kr.Editor.PauseEvent.prototype.getCurrentText = function() {
  return this.currentText_;
};

