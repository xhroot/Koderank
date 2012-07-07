
goog.provide('kr.WhiteboardPage');

goog.require('diff_match_patch');
goog.require('goog.dom');
goog.require('kr.Dashboard');
goog.require('kr.Dashboard.Light');
goog.require('kr.Data');
goog.require('kr.Data.Envelope');
goog.require('kr.Editor');
goog.require('kr.PatchManager');
goog.require('kr.events.EventType');



/**
 * Whiteboard page bindings to dom elements.
 * @param {boolean} isInterviewer Identifies type of user.
 * @param {string} interviewerKey Interviewer id.
 * @param {string} candidateKey Candidate id.
 * @param {string} twilioToken Used for establishing connection to Twilio.
 * @param {string} channelToken Unique identier to connect to Channel API.
 * @constructor
 */
kr.WhiteboardPage = function(isInterviewer, interviewerKey, candidateKey, 
    twilioToken, channelToken) {
  this.isInterviewer = isInterviewer;
  this.interviewerKey = interviewerKey;
  this.candidateKey = candidateKey;
  this.twilioToken = twilioToken;
  this.channelToken = channelToken;

  var userKey = (isInterviewer) ? interviewerKey : candidateKey;

  //
  // Instantiate main page components.
  //

  var hostElement = /** @type {HTMLTextAreaElement} */
      (goog.dom.getElement('code_window'));

  // Editor wraps CodeMirror and exposes methods/functions.
  var editor = new kr.Editor(hostElement);

  // Patcher is the diff'ing/matching/patching engine.
  var patcher = new diff_match_patch();

  // Patch manager stores, creates, and applies patches to editor.
  var patchManager = new kr.PatchManager(patcher);

  // Data class manages long poller and outgoing xhr messages.
  var data = new kr.Data();

  // Dashboard shows user relevant statuses.
  var candidateTypingLight = new kr.Dashboard.Light(goog.dom.getElement(
      'dash_edit_code'), 'edit-code-active.png', 'edit-code.png');
  var dashboard = new kr.Dashboard('/img/icon/', candidateTypingLight);

  // Prepare Twilio voice client.
  Twilio.Device.setup(twilioToken);

  // Set user specifics.
  if (this.isInterviewer) {
    editor.setCanEdit(false);

    // Have the interviewer request a full sync when socket opens.
    goog.events.listen(data, kr.events.EventType.SOCKET_OPEN,
        goog.bind(data.syncRequest, data, userKey));

    // Watch data for incoming patch.
    goog.events.listen(data, kr.events.EventType.PATCH_SMALL,
        // add to patchset and process consecutive
        function(e) {
          var event = /** @type {kr.Data.MessageEvent} */ (e);
          patchManager.addPatch(event.payload);
          var snapshotText = editor.getFullText();
          var newText = patchManager.processBuffer(snapshotText);
          editor.setFullText(newText);
          dashboard.setCandTypingLight(true);
        });

    // Watch data for incoming full text sync.
    goog.events.listen(data, kr.events.EventType.PATCH_FULL_TEXT,
        // apply full text
        goog.bind(function(e) {
          var event = /** @type {kr.Data.MessageEvent} */ (e);
          editor.setFullText(event.payload);
          patchManager.resetBuffer();
          dashboard.setCandTypingLight(false);
        }, this));


    // Assign call button to Twilio connect.
    var callButton = goog.dom.getElement('call');
    var hangupButton = goog.dom.getElement('hangup');
    goog.events.listen(callButton,
                       goog.events.EventType.CLICK,
                       function(e) {
                         var params = {'To' : candidateKey};
                         Twilio.Device.connect(params);
                         callButton.setAttribute('disabled', 'disabled');
                         hangupButton.removeAttribute('disabled');
                       });

    // Assign hangup button to Twilio disconnect.
    goog.events.listen(hangupButton,
                       goog.events.EventType.CLICK,
                       function(e) {
                         Twilio.Device.disconnectAll();
                         hangupButton.setAttribute('disabled', 'disabled');
                         callButton.removeAttribute('disabled');
                       });
  } else {

    // Watch for incoming calls. Auto connect.
    Twilio.Device.incoming(function(conn) {
      conn.accept();
    });

    // Watch data for sync request.
    goog.events.listen(data, kr.events.EventType.SYNC_REQUEST,
        goog.bind(editor.publishLongPause, editor));

    // Watch editor for small pause.  Create and send patch.
    goog.events.listen(editor, kr.events.EventType.EDITOR_SHORT_PAUSE,
        // send it out
        goog.bind(function(e) {
          var pauseEvent = /** @type {kr.Editor.PauseEvent} */ (e);
          var snapshotText = pauseEvent.getSnapshotText();
          var currentText = pauseEvent.getCurrentText();

          var patchPayload = patchManager.createPatchPayload(snapshotText,
              currentText);
          var envelope = new kr.Data.PatchEnvelope(userKey, patchPayload);
          data.sendMessage(envelope);
        }, this));

    // Watch editor for long pause.  Push full text.
    goog.events.listen(editor, kr.events.EventType.EDITOR_LONG_PAUSE,
        goog.bind(function(e) {
          var pauseEvent = /** @type {kr.Editor.PauseEvent} */ (e);
          var currentText = pauseEvent.getCurrentText();

          var envelope = new kr.Data.Envelope(userKey,
              kr.events.EventType.PATCH_FULL_TEXT, currentText);
          patchManager.resetBuffer();
          data.sendMessage(envelope);
        }, this));
  }

  goog.events.listen(goog.dom.getElement('testSettings'),
                     goog.events.EventType.CLICK,
                     function() {
        goog.window.popup('http://clientsupport.twilio.com');
                     });

  data.startChannel(channelToken);
};



goog.exportSymbol('wb', kr.WhiteboardPage);
