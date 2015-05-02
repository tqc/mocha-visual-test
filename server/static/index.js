angular.module('vtui', [])
    .controller('AppController', function($scope, $http) {
        var app = this;

        app.items = [];

        $scope.getItems = function() {
            $http.get("/test/screenshots")
                .success(function(data, status, headers, config) {
                    $scope.tests = data;
                    // this callback will be called asynchronously
                    // when the response is available
                })
                .error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });

        }

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
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

        $scope.getItems();

    });
