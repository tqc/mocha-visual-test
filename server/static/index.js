angular.module('vtui', [])
    .controller('AppController', function($scope, $http) {
        var app = this;

        app.items = [];

        $scope.getItems = function() {
            $http.get("/test/screenshots")
                .success(function(data, status, headers, config) {
                    $scope.tests = data;
                })
                .error(function(data, status, headers, config) {
                    console.log("Error getting screenshots");
                });

        };

        $scope.markGood = function(test) {
            $http.post("/test/markgood", {
                    title: test.title
                })
                .success(function(data, status, headers, config) {
                    delete test.diff;
                    // todo: need to trigger reload of the good element, since the file name remains the same
                    // this callback will be called asynchronously
                    // when the response is available
                })
                .error(function(data, status, headers, config) {
                    console.log("Error marking screenshot as good");
                });
        };

        $scope.getItems();

    });
