function FastMailEnhancementSuite(options) {
  // See: https://github.com/fastmail/overture

  // Configuration ////////////////////////////////////////////////////////////

  var defaults = {};

  $.each(FastMailEnhancementSuiteOptions, function() {
    defaults[this.name] = this['default'];
  });

  options = $.extend({}, defaults, options);

  // Utilities ////////////////////////////////////////////////////////////////

  $.fn.extend({
    onceOnly: function () {
      return this
        .not('.once-only')
        .addClass('once-only')
        ;
    },
    setInterval: function (fn, interval) {
      var that = $(this);
      var prev = undefined;

      $.setInterval(function() {
        var current = $(that.selector).length;

        if (current !== prev) {
          fn();
        }

        prev = current;
      }, interval);
    }
  });

  $.extend({
    setInterval: function(fn, interval) {
      // Call immediately, not just after the first interval
      fn();

      return setInterval(fn, interval);
    },
    keys: function (obj) {
      var a = [];
      $.each(obj, function(k) { a.push(k) });
      return a;
    },
    always: function (handler) {
      handler();
    },
    option: function (option, handler) {
      if (options[option] !== false) {
        handler();
      }
    },
    defined: function (val) {
      try {
        return typeof eval(val) !== 'undefined';
      } catch (err) {
        return false;
      }
    },
    endsWith: function (haystack, needle) {
      return haystack.length >= needle.length &&
        haystack.substr(haystack.length - needle.length) == needle;
    },
    urlParam: function (name) {
      var m = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);

      if (!m) {
          return undefined;
      }
      return decodeURIComponent(m[1]) || undefined;
    },
    waitFor: function(val, fn, interval) {
      var timeoutID = $.setInterval(function() {
        if (!$.defined(val)) {
          return;
        }
        clearTimeout(timeoutID);
        fn(eval(val));
      }, interval);
    },
    getSubject: function () {
      var instance = FastMail.mail.screens.compose.instance;

      return instance.get('subject');
    },
    setSubject: function (subject) {
      var instance = FastMail.mail.screens.compose.instance;

      O.RunLoop.invoke(() => {
        instance.set('subject', subject);
      });

      // Whilst we set the underlying data store we must also set the text
      // version when we are replying manually.
      $('.s-compose-subject div')[0].firstChild.nodeValue = subject + ' ';
    }
  });

  // Features /////////////////////////////////////////////////////////////////

  $.option('send_confirmation', function () {
    $.waitFor('FastMail.ComposeController.prototype.send', function(fn) {
      FastMail.ComposeController.prototype.send = function(t) {
        if (!confirm("Press OK to send email."))
          return;

        return fn.apply(this, Array.prototype.slice.call(arguments));
      };
    }, 500);
  });

  $.option('disable_send_mail', function () {
    // Hide the buttton
    $('<style/>')
      .prop('type', 'text/css')
      .html('.v-Button.s-send { display: none; }')
      .appendTo('head')
      ;

    // Actually disable the functionality (ie. Ctrl+Enter)
    $.waitFor('FastMail.ComposeController.prototype.send', function() {
      FastMail.ComposeController.prototype.send = function(t) {
        return;
      };
    }, 500);
  });

  $.option('search_box_ctrl_enter_current_folder', function () {
    $.waitFor('FastMail.views.mailSearchBox._search', function(fn) {
      FastMail.views.mailSearchBox._search = function (e) {
        if ((e.ctrlKey || e.metaKey) && (e.keyCode == 13 || e.keyCode == 10)) {
          FastMail.mail.set('searchIsGlobal', false);
          this.doSearch();
          return;
        }

        return fn.apply(this, Array.prototype.slice.call(arguments));
      };
    });
  });

  $.always(function () {
    $.setInterval(function() {
      var wrapper = $('.v-Compose-addCcBcc').onceOnly();

      if (wrapper.length == 0) {
        return;
      }

      $.option('rename_thread', function () {
        wrapper
          .find('a:first')
          .clone()
          .text("Rename thread")
          .prependTo(wrapper)
          .on('click', function() {
            var subject = prompt("Enter new subject name");

            if (subject != null) {
              $.setSubject(subject + " (was: \"" + $.getSubject() + "\")");
            }
          })
          ;
      });

      $.option('add_to_cc', function () {
        wrapper
          .find('a:first')
          .clone()
          .text("Add to CC")
          .prependTo(wrapper)
          .on('click', function() {
            var re = new RegExp(/^\[Adding (.*) to CC\]\n\n/);
            var instance = FastMail.mail.screens.compose.instance;

            var emails = prompt("Enter address to add to CC");

            if (emails == null) {
              return;
            }

            // Construct new "Cc" header.
            var cc = (instance.get('cc') + ', ' + emails).replace(/^, /, '');

            var body = instance.get('plainBody');
            var m = re.exec(body);

            // If it was already there, strip first, then append to existing
            // list.
            if (m != null) {
              body = body.replace(re, '');
              emails = m[1] + " & " + emails;
            }

            body = "[Adding " + emails + " to CC]\n\n" + body;

            O.RunLoop.invoke(() => {
              instance
                .set('cc', cc)
                .set('plainBody', body)
                ;
            });
          })
          ;
        });
    }, 500);
  });

  $.option('forgotten_attachment', function () {
    /*
    I have attached
    I've attached
    I have included
    I've included
    see the attached
    see the attachment
    attached file
    enclosed for
    */

    $.waitFor('FastMail.ComposeController.prototype.send', function(fn) {
      FastMail.ComposeController.prototype.send = function(t) {
        var instance = FastMail.mail.screens.compose.instance;

        var mentionsAttachments =
             /attach(ed|ment)/i.test(instance.plainBody)
          || /ve\sincluded/i.test(instance.plainBody)
          || /enclosed\sfor/i.test(instance.plainBody)
          ;

        if (mentionsAttachments && instance.attachments.length === 0 &&
              !confirm("Did you mean to attach files? Press OK to send anyway."))
          return;

        return fn.apply(this, Array.prototype.slice.call(arguments));
      };
    }, 500);
  });

  this.appendToSubject = function (request) {
    this.setSubject(
      $.getSubject() + request.selectionText.replace(/\s+/g, ' ')
    );
  };
}
