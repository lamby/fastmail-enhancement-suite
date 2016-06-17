function inject(content, callback) {
  var elem = document.createElement('script');

  if (content.indexOf('/') === 0) {
    elem.src = chrome.extension.getURL(content);
  } else {
    elem.textContent = content;
  }

  elem.onload = function () {
    this.parentNode.removeChild(this);
    typeof callback === 'function' && callback.apply(this);
  };

  (document.head || document.documentElement).appendChild(elem);
};

chrome.storage.sync.get(null, function(items) {
  inject('/pages/options.js', function() {
    inject('/js/jquery.js', function() {
      inject('/js/main.js', function() {
        inject('var FES = new FastMailEnhancementSuite(' + JSON.stringify(items) + ');');
      });
    });
  });
});

chrome.runtime.onMessage.addListener(function(request) {
  switch (request.cmd) {
  case 'appendToSubject':
    inject(
     'var i = FastMail.mail.screens.compose.instance;' +
     'i.subject += ' + JSON.stringify(request.selectionText) + ';' +
     '$(".s-compose-subject input").val(i.subject);'
    )
    break;
  }
});
