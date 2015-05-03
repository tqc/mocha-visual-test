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

            mocha.reporter(reporter);

            mocha.suite.on('pre-require', function(context, file, mocha) {
                console.log("suite setup");
                var assert = chai.assert;
                context.checkScreenshot = function(title, selector) {
                    if (window.callPhantom) {
                        var test = context.it(title, function(done) {
                            var el = $(selector);
                            assert(el.length > 0, "Element " + selector + " not found");

                            var cbId = "" + Math.random();
                            window.callbacks[cbId] = function(screenshot) {
                                delete window.callbacks[cbId];
                                if (!screenshot.hasGoodVersion) return done(new Error("No confirmed good screenshot available"));
                                if (!screenshot.matchesGoodVersion) return done(new Error("Screenshot does not match known good version"));
                                if (screenshot.matchesBadVersion) return done(new Error("Screenshot matches known bad version"));
                                done();
                            }

                            callPhantom({
                                event: "screenshotCheck",
                                selector: selector,
                                title: test.fullTitle(),
                                clipRect: el[0].getBoundingClientRect(),
                                callbackId: cbId
                            });
                        });
                    } else {
                        // screenshots require phantom - check that the element exists then skip
                        context.it(title, function() {
                            var el = $(selector);
                            assert(el.length > 0, "Element " + selector + " not found");
                            this.test.skip();
                        });
                    }
                };

            });

            mocha.setup("bdd");


            chai.should();

            callback();

        });
    });

};
