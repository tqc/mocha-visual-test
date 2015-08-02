var gulp = require('gulp');


function buildCssFile(inputFile, outputFile) {
    var params = ["--style", "nested", "-I", ".", inputFile, outputFile];
    var sassPath = process.platform === "win32" ? "sass.bat" : "sass";

    var spawn = require("child_process").spawn;
    var p = spawn(sassPath, params, {
    });
    p.stdout.on('data', function(data) {
        console.log("" + data);
    });

    p.stderr.on('data', function(data) {
        console.log("" + data);
    });
    p.on("close", function(code) {
        console.log("Done sass build of " + inputFile + " with code " + code);
    });

}

gulp.task('default', function() {
    buildCssFile("./server/css/index.scss", "./server/static/index.css");
});
