#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var filename = "temp.junk";


var assertFileExists = function(infile) {
    console.log("assertFileExists - infile: ["+infile+"]");
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
  //assertFileExists(htmlfile);
  return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var buildfn = function(checks) {
  var response2console = function(result, response) {
    //console.log("Hi - 3");
    if (result instanceof Error) {
     //console.log("Hi - 4a");
     console.error('Error: ' + util.format(response.message));
    } else {
      //console.log("Hi - 4b");
      fs.writeFileSync(filename, result);
      //console.log("Hi - 5");
      var checkJson = checkHtmlFile(filename, checks);
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    }
  };
  return response2console;
};


var processCommand = function(file, url, checks) {
  //console.log("Hi - 0");
  if(url){
    //console.log("Hi - 1");
    var response2console = buildfn(checks);
    //console.log("Hi - 2");
    rest.get(url).on('complete', response2console);
  } else {
    var checkJson = checkHtmlFile(file, checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  }
};

var checkHtmlFile = function(htmlfile, checksfile) {
  //console.log("checkHtmlFile - htmlfile: ["+htmlfile+"] / checksfile: ["+ checksfile +"]");

  $ = cheerioHtmlFile(htmlfile);

  //console.log("checkHtmlFile - $: ["+$.html()+"]");

  var checks = loadChecks(checksfile).sort();
  var out = {};
  for(var ii in checks) {
    var present = $(checks[ii]).length > 0;
    out[checks[ii]] = present;
  }
  return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', "URL to check")
        .parse(process.argv);
    var checkJson = processCommand(program.file, program.url, program.checks);
    //var outJson = JSON.stringify(checkJson, null, 4);
    //console.log(outJson);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

