// setup needed in the browser - events, custom reporter etc

exports.init = function(callback) {
    if (!window.callPhantom) {
        // ignore phantom stuff when running in a browser
        window.callPhantom = function() {};
    }
    $.getScript("https://cdnjs.cloudflare.com/ajax/libs/mocha/2.2.4/mocha.min.js", function(data, textStatus, jqxhr) {
        $.getScript("https://cdnjs.cloudflare.com/ajax/libs/chai/2.3.0/chai.min.js", function(data, textStatus, jqxhr) {
            console.log("Load was performed.");
            callPhantom({
                event: "mochaReady"
            })

            // set up a reporter that will fire events
            var reporter = function(runner) {
                var passes = 0;
                var failures = 0;

                runner.on('pass', function(test) {
                    passes++;
                    callPhantom({
                        event: "mochaPass",
                        title: test.fullTitle()
                    })

                    console.log('pass: %s', test.fullTitle());
                });

                runner.on('fail', function(test, err) {
                    failures++;
                    callPhantom({
                        event: "mochaFail",
                        title: test.fullTitle(),
                        message: err.message
                    })

                    console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
                });

                runner.on('end', function() {
                    callPhantom({
                        event: "mochaDone",
                        passes: passes,
                        failures: failures,
                        total: passes + failures
                    })

                    console.log('end: %d/%d', passes, passes + failures);
                });
            }

            window.callbacks = {};

            // check against screenshot

            chai.util.addProperty(chai.Assertion.prototype, 'matchGoodVersion', function() {
                var screenshot = this._obj

                this.assert(
                    screenshot.hasGoodVersion,
                    'No confirmed good screenshot available'
                );

                this.assert(
                    screenshot.matchesGoodVersion,
                    'Screenshot does not match known good version'
                );
                if (screenshot.hasBadVersion) {
                    this.assert(
                        !screenshot.matchesBadVersion,
                        'Screenshot matches known bad version'
                    );

                }

            })

            window.checkScreenshot = function(title, selector, callback) {
                var cbId = "" + Math.random();
                var el = $(selector);
                chai.assert(el.length > 0, "Element "+selector+" not found");

                window.callbacks[cbId] = function(data) {
                    delete window.callbacks[cbId];
                    callback(data);
                }
                callPhantom({
                    event: "screenshotCheck",
                    selector: selector,
                    title: title,
                    clipRect: el[0].getBoundingClientRect(),
                    callbackId: cbId
                });
            }

            mocha.reporter(reporter);
            mocha.setup("bdd");
            chai.should();

            callback();

        });
    });

};
