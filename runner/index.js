// runner module.
var Mocha = require('mocha');

require("chai").should();
var path = require("path");
var fs = require("fs");
var looksSame = require('looks-same');



function runInternal(url) {
    var phantom = require("phantom");
    describe("Phantom", function() {
        var ph;
        var page;
        var test;
        var suite = this;
        before(function(done) {
            this.timeout(600000);
            phantom.create(function(ph2) {
                ph = ph2;
                ph.createPage(function(p) {
                    page = p;
                    page.set("viewportSize", {
                        width: 1024,
                        height: 1024
                    });
                    page.set("onError", function(data) {
                        throw new Error(data);
                    });
                    page.set("onResourceError", function(resourceError) {
                        // ignore resource errors for now
                        // todo: add an option to fail on all resource errors
                        console.log(resourceError.errorString);
                        // suite.emit("error", new Error(resourceError.errorString));
                    });
                    page.set("onCallback", function(data) {
                        if (!data) return;
                        if (data.event == "mochaReady") {
                            page.evaluate(function() {
                                mocha.run();
                            });
                        } else if (data.event == "mochaPass") {
                            test = new Mocha.Test(data.title, function(done2) {
                                done2();
                            });
                            suite.addTest(test);

                        } else if (data.event == "mochaPending") {
                            test = new Mocha.Test(data.title);
                            suite.addTest(test);
                        } else if (data.event == "mochaFail") {
                            test = new Mocha.Test(data.title, function(done2) {
                                throw (new Error(data.message));
                            });
                            suite.addTest(test);
                        } else if (data.event == "mochaDone") {
                            done();
                        } else if (data.event == "screenshotCheck") {
                            // todo: save/check screenshots
                            var basepath = path.resolve("./screenshots/" + data.title + "");

                            var goodImage = basepath + " - good.png";
                            var badImage = basepath + " - bad.png";
                            var currentImage = basepath + " - current.png";
                            var diffImage = basepath + " - diff.png";
                            page.set("clipRect", data.clipRect);
                            if (fs.existsSync(currentImage)) fs.unlinkSync(currentImage);
                            page.render(currentImage, function() {

                                var result = {
                                    hasGoodVersion: false,
                                    matchesGoodVersion: false,
                                    hasBadVersion: false,
                                    matchesBadVersion: false
                                };

                                function returnResult() {
                                    page.evaluate(function(cbId, data2) {
                                        window.callbacks[cbId](data2);
                                    }, function() {}, data.callbackId, result);
                                }

                                if (fs.existsSync(goodImage)) {
                                    result.hasGoodVersion = true;
                                    looksSame(goodImage, currentImage, {
                                        strict: true
                                    }, function(error, equal) {
                                        if (error) {
                                            console.log(error);
                                        }
                                        //equal will be true, if images looks the same
                                        result.matchesGoodVersion = equal || false;
                                        if (!equal) {
                                            looksSame.createDiff({
                                                reference: goodImage,
                                                current: currentImage,
                                                diff: diffImage,
                                                highlightColor: '#ff00ff', //color to highlight the differences
                                                strict: true,
                                            }, function(error2) {
                                                returnResult();

                                            });

                                        } else if (fs.existsSync(diffImage)) {
                                            fs.unlinkSync(diffImage);
                                            returnResult();
                                        } else {
                                            returnResult();
                                        }

                                    });
                                } else if (fs.existsSync(badImage)) {
                                    result.hasBadVersion = true;
                                    looksSame(badImage, currentImage, {
                                        strict: true
                                    }, function(error, equal) {
                                        //equal will be true, if images looks the same
                                        result.matchesBadVersion = !equal;
                                        returnResult();
                                    });
                                } else {
                                    returnResult();
                                }
                            });

                        } else {
                            console.log(data);
                        }
                    });
                    page.open(url, function(status) {
                        status.should.equal("success");
                    });
                });
            }, {
                parameters: {
                    "ignore-ssl-errors": true
                }
            });
        });

        after(function() {
            ph.exit();
        });

        it("should load page", function(done) {
            page.evaluate(function() {
                return document.title;
            }, function(result) {
                console.log('Page title is ' + result);
                done();
            });
        });


    });
}

function runInGulp(url, options, done) {
    var mocha = new Mocha(options);

    mocha.suite.emit('pre-require', global, "not a file", mocha);
    //    mocha.suite.emit('require', require(file), file, self);
    //    mocha.suite.emit('post-require', global, file, self);

    runInternal(url);
    mocha.run(function(e) {
        if (done) done(e);
    });
}


exports.run = function(url, options, callback) {
    if (typeof describe === "undefined") {
        // must be running in gulp - need to set up new mocha instance
        runInGulp(url, options, callback);
    } else {
        // running in mocha
        runInternal(url);
    }
};
