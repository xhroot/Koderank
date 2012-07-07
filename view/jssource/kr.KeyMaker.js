
goog.provide('kr.KeyMaker');

goog.require('goog.net.XhrIo');
goog.require('kr.Data');



//`` Refactor:
//   - class is misnamed
//   - class is confusing mess of UI, BL, and XHR



/**
 * Creates interviewer and candidate keys and renders to node via template.
 *
 * @param {Function} keyTemplate The template function for rendering the
 *                   generated keys.
 * @param {Function} renderCallback The callback function to use for rendering
 *                   links.
 * @constructor
 */
kr.KeyMaker = function(keyTemplate, renderCallback) {
  this.keyTemplate = keyTemplate;
  this.renderCallback = renderCallback;
};


/**
 * Requests 2 new keys from server via ajax.
 */
kr.KeyMaker.prototype.makeKeysRequest = function() {
  goog.net.XhrIo.send('create', goog.bind(this.makeKeysResponse, this), 'POST');
};


/**
 * Server's response to key request.
 *
 * @param {goog.events.Event} e Event.
 */
kr.KeyMaker.prototype.makeKeysResponse = function(e) {
  var xhr = /** @type {goog.net.XhrIo} */ (e.target);
  if (xhr.getStatus() == 200) {
    var keys = xhr.getResponseJson();
    this.renderLinks(keys);
  }
};


/**
 * Renders key links to html template.
 *
 * @param {Object|null|undefined} keys Has the keys for the interviewer and the
 * candidate.
 */
kr.KeyMaker.prototype.renderLinks = function(keys) {
  var linkVM = {
    i_link: document.location.href + 'whiteboard?x=' + keys['i'],
    c_link: document.location.href + 'whiteboard?x=' + keys['c']
  };
  var html = this.keyTemplate(linkVM);
  this.renderCallback(html);

  goog.events.listen(goog.dom.getElement('send'),
                     goog.events.EventType.CLICK,
                     goog.bind(this.sendEmail, this, keys['c']));
};


/**
 * Sends email with link to Candidate.
 *
 * @param {string} code The candidates whiteboard key.
 */
kr.KeyMaker.prototype.sendEmail = function(code) {
  console.log('sendemail');
  // Check for blank.
  var email = goog.dom.getElement('email');
  if (email.value == '') {
    this.setStatus(false, 'Please use a valid email address');
    return;
  }
  // Disable send button.
  this.setSendEnabled(false);
  // Show spinner.
  var progress = goog.dom.getElement('mail_progress');
  goog.dom.classes.enable(progress, 'hidden', false);
  // Request keys from server.
  var payload = 'email=' + email.value + '&code=' + code;
  goog.net.XhrIo.send('email', goog.bind(this.sendEmailResponse, this), 'POST',
      payload);
};


/**
 * Enables or disables the send button.
 *
 * @param {boolean} isEnabled Status for send button.
 */
kr.KeyMaker.prototype.setSendEnabled = function(isEnabled) {
  var sendButton = goog.dom.getElement('send');
  goog.dom.classes.enable(sendButton, 'disabled', !isEnabled);
  goog.dom.classes.enable(sendButton, 'btn-primary', isEnabled);
};


/**
 * Server response to email request.
 *
 * @param {goog.events.EventTarget} e Event target.
 */
kr.KeyMaker.prototype.sendEmailResponse = function(e) {
  // Hide spinner.
  var progress = goog.dom.getElement('mail_progress');
  goog.dom.classes.enable(progress, 'hidden', true);

  var xhr = /** @type {goog.net.XhrIo} */ (e.target);

  // Handle network errors.
  if (xhr.getStatus() != 200) {
    // Enable send button, for retries/corrections.
    this.setSendEnabled(true);
    // Show error message.
    this.setStatus(false, 'There was a problem sending email.');
    return;
  }

  // Handle server errors.
  var vm = xhr.getResponseJson();
  if (!vm['IsSuccess']) {
    // Enable send button, for retries/corrections.
    this.setSendEnabled(true);
    // Show error message.
    this.setStatus(false, vm['Messages'][0]);
    return;
  }

  // Show success message.
  this.setStatus(true, vm['Messages'][0]);
  // Clear email field.
  goog.dom.getElement('email').value = '';


};


/**
 * Show feedback bar to user with message.
 *
 * @param {boolean} isSuccess Used to show success or error alert.
 * @param {string} message Message in the info bar.
 */
kr.KeyMaker.prototype.setStatus = function(isSuccess, message) {
  var status = goog.dom.getElement('mail_status');

  // Set CSS type based on success status.
  goog.dom.classes.enable(status, 'alert-success', isSuccess);
  goog.dom.classes.enable(status, 'alert-error', !isSuccess);

  // Set text.
  status.innerHTML = message;

  // Show element.
  goog.dom.classes.enable(status, 'hidden', false);
};

