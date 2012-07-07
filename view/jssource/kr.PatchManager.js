
goog.provide('kr.PatchManager');

goog.require('diff_match_patch');
goog.require('goog.events');
goog.require('goog.events.EventTarget');



/**
 * Manages a set of patches.
 *
 * @param {!diff_match_patch} patcher Diff/patching engine.
 * @constructor
 * @extends {goog.events.EventTarget}
 */
kr.PatchManager = function(patcher) {
  goog.events.EventTarget.call(this);

  /** @private */
  this.patcher_ = patcher;

  /** @private */
  this.buffer_ = {};

  /** @private */
  this.counter_ = 0;
};
goog.inherits(kr.PatchManager, goog.events.EventTarget);


/** Clear patch buffer and reset counter. */
kr.PatchManager.prototype.resetBuffer = function() {
  this.buffer_ = {};
  this.counter_ = 0;
};


/** @return {string} The next patch id. */
kr.PatchManager.prototype.getNextPatchId = function() {
  return 'p' + this.counter_;
};


/**
 * Add patch into buffer and reprocess buffers to get new text.
 * @param {Object} messageObject The message with the new patch.
 */
kr.PatchManager.prototype.addPatch = function(messageObject) {
  goog.object.extend(this.buffer_, messageObject);
};


/**
 * Cycle through buffer, starting with current counter id. If a patch comes in
 * out of order, it stays in the buffer until the next patch arrives.  It will
 * only be applied after the patch immediately preceding is applied.
 *
 * @param {string} oldText The current soon-to-be-old text.
 * @return {string} new text with all valid patches applied.
 */
kr.PatchManager.prototype.processBuffer = function(oldText) {
  var patchId = this.getNextPatchId();
  var workingText = oldText;

  while (this.buffer_[patchId]) {
    // apply next sequential patch to old text
    workingText = this.applyPatch(this.buffer_[patchId], workingText);
    goog.object.remove(this.buffer_, patchId);

    this.counter_++;
    patchId = this.getNextPatchId();
  }
  return workingText;
};


/**
 * Applies single patch to convert snapshot to current.
 * @param {!diff_match_patch.patch_obj} patch Current patch to apply.
 * @param {string} snapshot Text to be patched.
 * @return {string} Current text.
 */
kr.PatchManager.prototype.applyPatch = function(patch, snapshot) {
  var newText = this.patcher_.patch_apply([patch], snapshot);
  return /** @type {string} */ (newText[0]);
};


/**
 * Create a diff/patch, get next patch Id, wrap in payload.
 * @param {string} snapshotText The text after last patch.
 * @param {string} currentText The text now.
 * @return {Object} payload.
 */
kr.PatchManager.prototype.createPatchPayload = function(snapshotText, 
    currentText) {
  var payload = {};
  var patchId = this.getNextPatchId();
  var patchArray = this.patcher_.patch_make(snapshotText, currentText);

  // There should be 1 and only 1 patch.
  var patch = patchArray[0];

  // Store patch using patchId as key.
  payload[patchId] = patch;
  this.counter_++;
  return payload;
};

