
goog.provide('kr.Data');
goog.provide('kr.Data.Envelope');
goog.provide('kr.Data.PatchEnvelope');

goog.require('goog.events');
goog.require('goog.events.EventTarget');
goog.require('goog.net.XhrManager');



/**
 * Manages all RPC data including channel API.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
kr.Data = function() {
  goog.events.EventTarget.call(this);

  /**
   * Channel API, {goog.appengine.Socket}, long poller.
   * @private
   */
  this.socket_ = null;

  var headers = new goog.structs.Map(
      {'Content-Type': 'application/x-www-form-urlencoded'});
  this.xhrManager = new goog.net.XhrManager(1, headers, 1, 5);
};
goog.inherits(kr.Data, goog.events.EventTarget);


/**
 * Initiate channel
 * @param {string} token Channel token.
 */
kr.Data.prototype.startChannel = function(token) {
  var channel = new appengine.Channel(token);
  this.socket_ = channel.open();
  this.socket_.onopen = goog.bind(this.onSocketOpen, this);
  this.socket_.onmessage = goog.bind(this.onSocketMessage, this);
};


/**
 * Fires event when channel is established.
 */
kr.Data.prototype.onSocketOpen = function() {
  this.dispatchEvent(kr.events.EventType.SOCKET_OPEN);
};


/**
 * Fires event when messages arrive from channel.
 * @param {{data: string}} jsonMessage Incoming message.
 */
kr.Data.prototype.onSocketMessage = function(jsonMessage) {
  var envelope = /** @type {kr.Data.Envelope} */
      (goog.json.parse(jsonMessage.data));

  var messageEvent = new kr.Data.MessageEvent(envelope.eventType,
      envelope.payload);
  this.dispatchEvent(messageEvent);
};


/**
 * Closes the socket permanently.
 */
kr.Data.prototype.destroyChannel = function() {
  this.socket_.close();
};


/**
 * Send message.
 * @param {kr.Data.Envelope} envelope Wrapper containing data to be sent.
 */
kr.Data.prototype.sendMessage = function(envelope) {
  var jsonMessage = goog.json.serialize(envelope);
  var messageId = goog.getUid(envelope);
  this.xhrManager.send(messageId.toString(), '/message', 'POST', jsonMessage);
};


/**
 * @param {string} senderKey Explicit message to request full sync.
 */
kr.Data.prototype.syncRequest = function(senderKey) {
  var envelope = new kr.Data.Envelope(senderKey,
      kr.events.EventType.SYNC_REQUEST);
  this.sendMessage(envelope);
};



/**
 * Generic message wrapper. Payload structure is the responsibility of
 * instantiator.
 * @param {string} senderKey User id.
 * @param {kr.events.EventType} eventType Event to dispatch when received.
 * @param {Object|string=} opt_payload Data to send with event.
 * @constructor
 */
kr.Data.Envelope = function(senderKey, eventType, opt_payload) {
  // Server expects sender id in argument 'key'.  Prevent compiler renaming.
  this['key'] = senderKey;

  this.eventType = eventType;
  this.payload = opt_payload;
};



/**
 * Patch message wrapper. Payload structure is the responsibility of
 * instantiator.
 * @param {string} senderKey User id.
 * @param {Object} patchPayload Structure should be
 *                 {'p4': !diff-match-patchobj}.
 * @constructor
 * @extends {kr.Data.Envelope}
 */
kr.Data.PatchEnvelope = function(senderKey, patchPayload) {
  kr.Data.Envelope.call(this, senderKey, kr.events.EventType.PATCH_SMALL,
      patchPayload);
};
goog.inherits(kr.Data.PatchEnvelope, kr.Data.Envelope);



/**
 * Data event with message payload.
 * @param {kr.events.EventType} eventType Event from sender.
 * @param {Object} payload Structure is the responsibility of receiver.
 * @constructor
 * @extends {goog.events.Event}
 */
kr.Data.MessageEvent = function(eventType, payload) {
  goog.events.Event.call(this, eventType);
  this.payload = payload;
};




