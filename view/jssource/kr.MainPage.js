
goog.provide('kr.MainPage');

goog.require('goog.dom');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.IdGenerator');
goog.require('goog.window');
goog.require('kr.KeyMaker');
goog.require('kr.Templates');



/**
 * Main page bindings to dom elements.
 * @constructor
 */
kr.MainPage = function() {
  var callback = function(html) {
    goog.dom.getElement('links').innerHTML = html;
  };

  var keyMaker = new kr.KeyMaker(kr.Templates.links, this.ShowLinks);
  goog.events.listen(goog.dom.getElement('create'),
                     goog.events.EventType.CLICK,
                     goog.bind(keyMaker.makeKeysRequest, keyMaker));
};


/**
 * Creates dialog box for displaying link HTML
 * @param {string} html The HTML link content to display.
 */
kr.MainPage.prototype.ShowLinks = function(html) {
  // Render a dialog box.
  var dlog = new goog.ui.Dialog();
  dlog.setContent(html);
  dlog.setTitle('Interview Links');
  dlog.setButtonSet(goog.ui.Dialog.ButtonSet.createOk());
  dlog.setDisposeOnHide(true);
  dlog.setVisible(true);

  // Access buttons _after_ rendering. Decorate with bootstrap UI.
  var ok = dlog.getButtonSet().getButton(goog.ui.Dialog.DefaultButtonKeys.OK);
  goog.dom.classes.add(ok, 'btn');
};


goog.exportSymbol('main', kr.MainPage);
