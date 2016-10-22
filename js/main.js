function FastMailEnhancementSuite(options) {

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
        fn();
      }, interval);
    }
  });

  // Features /////////////////////////////////////////////////////////////////

  $.option('send_confirmation', function () {
    $.waitFor('FastMail.ComposeController.prototype.send', function() {
      var fn = FastMail.ComposeController.prototype.send;

      FastMail.ComposeController.prototype.send = function(t) {
        if (!confirm("Press OK to send email."))
          return;

        return fn.apply(this, Array.prototype.slice.call(arguments));
      };
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

    $.waitFor('FastMail.ComposeController.prototype.send', function() {
      var fn = FastMail.ComposeController.prototype.send;

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
    var instance = FastMail.mail.screens.compose.instance;

    // Set the underlying data store; simply adjusting the element won't change
    // the email once sent.
    instance.subject += request.selectionText.replace(/\s+/g, ' ');

    // Update the "Subject" element
    $('.s-compose-subject input').val(instance.subject);
  };
}
