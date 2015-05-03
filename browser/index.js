// setup needed in the browser - events, custom reporter etc

exports.init = function(callback) {
    $.getScript("https://cdnjs.cloudflare.com/ajax/libs/mocha/2.2.4/mocha.min.js", function(data, textStatus, jqxhr) {
        $.getScript("https://cdnjs.cloudflare.com/ajax/libs/chai/2.3.0/chai.min.js", function(data, textStatus, jqxhr) {

            if (window.callPhantom) {
                callPhantom({
                    event: "mochaReady"
                })
            } else {
                console.log("Load was performed.");
            }
            // set up a reporter that will fire events
            var reporter = function(runner) {
                var passes = 0;
                var pending = 0;
                var failures = 0;

                runner.on('pass', function(test) {
                    passes++;
                    if (window.callPhantom) {
                        callPhantom({
                            event: "mochaPass",
                            title: test.fullTitle()
                        })
                    } else {
                        console.log('pass: %s', test.fullTitle());
                    }
                });

                runner.on('pending', function(test) {
                    pending++;
                    if (window.callPhantom) {
                        callPhantom({
                            event: "mochaPending",
                            title: test.fullTitle()
                        })
                    } else {
                        console.log('pending: %s', test.fullTitle());
                    }
                });

                runner.on('fail', function(test, err) {
                    failures++;
                    if (window.callPhantom) {
                        callPhantom({
                            event: "mochaFail",
                            title: test.fullTitle(),
                            message: err.message
                        })
                    } else {
                        console.log('fail: %s -- error: %s', test.fullTitle(), err.message);
                    }
                });

                runner.on('end', function() {
                    if (window.callPhantom) {
                        callPhantom({
                            event: "mochaDone",
                            passes: passes,
                            failures: failures,
                            pending: pending,
                            total: passes + pending + failures
                        })
                    } else {
                        console.log('end: %d/%d passed with %d skipped', passes, passes + failures, pending);
                    }
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
                    this.assert(!screenshot.matchesBadVersion,
                        'Screenshot matches known bad version'
                    );

                }

            })

            window.checkScreenshot = function(title, selector, callback) {
                var cbId = "" + Math.random();
                var el = $(selector);
                chai.assert(el.length > 0, "Element " + selector + " not found");
                chai.assert(window.callPhantom, "Screenshot tests must be run in phantom");

                window.callbacks[cbId] = function(data) {
                    delete window.callbacks[cbId];
                    callback(data);
                }
                if (window.callPhantom) {
                    callPhantom({
                        event: "screenshotCheck",
                        selector: selector,
                        title: title,
                        clipRect: el[0].getBoundingClientRect(),
                        callbackId: cbId
                    });
                } else {}
            }

            mocha.reporter(reporter);
            mocha.setup("bdd");
            chai.should();

            callback();

        });
    });

};
