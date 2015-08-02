# mocha-visual-test

[ ![Codeship Status for tqc/mocha-visual-test](https://codeship.com/projects/d2270660-1b30-0133-420c-7e346f2e432c/status?branch=master)](https://codeship.com/projects/94443)

Run browser based mocha/chai tests in PhantomJS, take screenshots and compare with previous test runs for automated visual regression testing.

After the first test run, use the web interface to mark visual tests as passed/failed:

![Test UI](/ui.png?raw=true "Test UI")

## Setup

These instructions assume a browserify based app with jquery available and a node.js server running locally for development.

PhantomJS needs to be available in the path - see https://github.com/sgentle/phantomjs-node

    npm install --save-dev mocha-visual-test

### Browser

    var mvt = require("mocha-visual-test/browser");
    mvt.init(function() {
        // mocha loaded, create tests.

        it("should pass", function() {
            "".should.equal("");
        })

        it("should fail", function() {
            "".should.not.equal("");
        })

        it("should fail async with exception", function(done) {
            window.setTimeout(function() {
                try {
                    "".should.not.equal("");
                }
                catch (e) {
                    return done(e);
                }
                done();
            })
        })

        checkScreenshot("invalid screenshot", ".notanelement");
        checkScreenshot("page screenshot", ".page");

    });

The init function loads mocha and chai scripts from cdn and runs mocha.setup. It does not require changes to the html or trigger mocha.run, so the test file can safely be included in all debug mode browserify builds - simply call mocha.run() from the console to run tests manually.

Screenshot functionality is not available in the browser, so screenshot tests will show as pending when run this way. 

### Test Runner

    var mvt = require("mocha-visual-test/runner");
    mvt.run("http://localhost:5000/index.html");

Calling run opens the given url in phantomJS, calls mocha.run() and converts the tests running in the browser into local mocha tests so that all the regular mocha reporting options work.

### Web Server

    var express = require("express");
    var app = express();
    require("mocha-visual-test/server")(app, express);

This will expose the visual test interface on /test.



