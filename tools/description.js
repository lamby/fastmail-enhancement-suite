var fs = require('fs');

eval(fs.readFileSync('pages/options.js') + '');

for (var i = 0; i < FastMailEnhancementSuiteOptions.length; ++i) {
  var option = FastMailEnhancementSuiteOptions[i];

  console.log(' - ' + option.title + ': ' + option.description);
}
