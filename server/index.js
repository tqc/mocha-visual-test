// add the test ui to an express web app
var fs = require("fs");
var path = require("path");
var bodyparser = require("body-parser");

module.exports = function(app, express) {
    console.log("setting up test ui on server");

    var folder = path.resolve("./screenshots");

    app.get("/test/screenshots", function(req, res) {
        var list = fs.readdirSync(folder);
        var tests = {};
        for (var i = 0; i < list.length; i++) {
            var n = list[i];
            var bn = n.substr(0, n.lastIndexOf(" - "));
            var type = n.substr(n.lastIndexOf(" - ") + 3);
            type = type.substr(0, type.length - 4);
            tests[bn] = tests[bn] || {
                title: bn,
            };
            tests[bn][type] = "/test/images/" + n;
        }

        var result = [];

        for (var k in tests) {
            var test = tests[k];
//            if (!test.good && !test.bad) 
            result.push(test);
        }
        result.sort(function(a, b) {
            if (a.title < b.title) {
                return -1;
            }
            if (a.title > b.title) {
                return 1;
            }
            return 0;
        });
        res.json(result);
    });
    app.use("/test", bodyparser.json());

    app.post("/test/markgood", function(req, res) {
		var bn = folder+"/"+req.body.title;
		var fc = bn+" - current.png";
		var fg = bn+" - good.png";
		var fb = bn+" - bad.png";
		var fd = bn+" - diff.png";

		fs.writeFileSync(fg, fs.readFileSync(fc));
		if (fs.existsSync(fd)) fs.unlinkSync(fd);
		if (fs.existsSync(fb)) fs.unlinkSync(fb);

		res.json({});
	});

    app.post("/test/markbad", function(req, res) {
		console.log(req.body.title);	
		res.json({});
	});

    app.use("/test/images", express.static(path.resolve("./screenshots")));
    app.use("/test", express.static(path.resolve(__dirname, "./static")));


};
