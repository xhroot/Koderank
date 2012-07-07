
goog.provide('kr.events.EventType');


/**
 * Koderank event constants
 * @enum {string}
 */
kr.events.EventType = {
  // candidate events
  EDITOR_SHORT_PAUSE: goog.events.getUniqueId('editor-short-pause'),
  EDITOR_LONG_PAUSE: goog.events.getUniqueId('editor-long-pause'),
  SYNC_REQUEST: goog.events.getUniqueId('sync-request'),

  // interviewer events
  PATCH_SMALL: goog.events.getUniqueId('patch-small'),
  PATCH_FULL_TEXT: goog.events.getUniqueId('patch-full-text'),
  SOCKET_OPEN: goog.events.getUniqueId('socket-open'),

  // dashboard events
  CANDIDATE_BLUR: goog.events.getUniqueId('candidate-blur'),
  CANDIDATE_TYPING: goog.events.getUniqueId('candidate-typing'),
  CALL_CONNECT: goog.events.getUniqueId('call-connect')
};
