// runner module.
var mocha = require("mocha");
var should = require("chai").should();
var path = require("path");
var fs = require("fs");
var looksSame = require('looks-same');

exports.run = function(url) {
    var Test = require("mocha/lib/test");
    var phantom = require("phantom");
    describe("Phantom", function() {
        var ph;
        var page;
        var tests = {};
        var suite = this;
        before(function(done) {
            this.timeout(15000);
            phantom.create(function(ph2) {
                ph = ph2;
                ph.createPage(function(p) {
                    page = p;
                    page.set("onError", function(data) {
                        throw new Error(data);
                    });
                    page.set("onResourceError", function(resourceError) {
                        suite.emit("error", new Error(resourceError.errorString));
                    });
                    page.set("onCallback", function(data) {
                        if (!data) return;
                        if (data.event == "mochaReady") {
                            page.evaluate(function() {
                                mocha.run();
                            });
                        } else if (data.event == "mochaPass") {
                            console.log(data);
                            var test = new Test(data.title, function(done) {
                                done();
                            });
                            suite.addTest(test);

                        } else if (data.event == "mochaPending") {
                            console.log(data);
                            var test = new Test(data.title);
                            suite.addTest(test);

                        } else if (data.event == "mochaFail") {
                            var test = new Test(data.title, function(done) {
                                throw (new Error(data.message));
                            });
                            suite.addTest(test);
                        } else if (data.event == "mochaDone") {
                            console.log(data);
                            done();
                        } else if (data.event == "screenshotCheck") {
                            // todo: save/check screenshots
                            var basepath = "./screenshots/" + data.title + "";

                            var goodImage = basepath + " - good.png";
                            var badImage = basepath + " - bad.png";
                            var currentImage = basepath + " - current.png";
                            var diffImage = basepath + " - diff.png";
                            page.clipRect = data.clipRect;
                            if (fs.existsSync(currentImage)) fs.unlinkSync(currentImage);
                            page.render(currentImage, function() {

                                var result = {
                                    hasGoodVersion: false,
                                    matchesGoodVersion: false,
                                    hasBadVersion: false,
                                    matchesBadVersion: false
                                };

                                function returnResult() {
                                    console.log(result);
                                    page.evaluate(function(cbId, data) {
                                        window.callbacks[cbId](data);
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
                                            }, function(error) {
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
        })


    });
};
