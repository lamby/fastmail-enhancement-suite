chrome.storage.sync.get(null, function(items) {
  // NB. Repeating the default here - we don't have access to the options
  // structure.
  if (items.append_to_subject === false) {
    return;
  }

  chrome.contextMenus.create({
    'title': "Append '%s' to subject",
    'contexts': ['selection'],
    'documentUrlPatterns': [
        'http://*.fastmail.com/mail/compose*'
      , 'https://*.fastmail.com/mail/compose*'
    ],
    'onclick': function(info, tab) {
      chrome.tabs.sendMessage(tab.id, {
          'cmd': 'appendToSubject'
        , 'selectionText': info.selectionText
      });
    }
  });
});
