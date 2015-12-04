chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab.url.indexOf('.fastmail.com') > -1) {
    chrome.pageAction.show(tabId);
  }
});
