chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab.url.indexOf('.fastmail.com') > -1) {
    chrome.pageAction.show(tabId);
  }
});

chrome.contextMenus.create({
  "title": "Append '%s' to subject",
  "contexts": ["selection"],
  "documentUrlPatterns": [
      "http://*.fastmail.com/mail/compose*"
    , "https://*.fastmail.com/mail/compose*"
  ],
  "onclick": function(info, tab) {
    chrome.tabs.sendMessage(tab.id, {
        'cmd': 'appendToSubject'
      , 'selectionText': info.selectionText
    });
  }
});
