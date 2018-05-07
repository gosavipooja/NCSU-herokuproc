var app = angular.module('myApp', ['ngRoute', 'ngMaterial', 'ui.bootstrap']);

app.config(function config($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        templateUrl: 'partials/list.html',
        controller: 'index'
    }).when('/details', {
        templateUrl: 'partials/details.html',
        controller: 'index'
    }).otherwise({
        redirectTo: '/'
    });

    $locationProvider.html5Mode(true);
});

app.factory('Storage', ['$window', function ($window) {
    return {
        get: function (key) {
            var value = $window.localStorage[key];
            return value ? JSON.parse(value) : null;
        },
        set: function (key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        remove: function (key) {
            $window.localStorage.removeItem(key);
        },
        removeAll: function () {
            $window.localStorage.clear();
        }
    }
}]);

app.controller('index', ['$scope', '$location', 'Storage', '$http', '$modal', '$sce', function ($scope, $location, Storage, $http, $modal, $sce) {

    $scope.data = {};
    $scope.proclist = {};
    $scope.procedure = {};
    $scope.selected_step = {};
    $scope.fileUpload = false;

    $scope.init = function () {
        console.log('Init...');
        if (Storage.get('data')) {
            console.log('Stored data found.');
            $scope.data = Storage.get('data');
            $scope.proclist = Storage.get('proclist');
        } else {
            console.log('No stored data found...  reading json files from DB.');
            $scope.readDBJsonFiles();
            console.log('Data is set');
        }
        $scope.procedure = Storage.get('procedure');
        $scope.selected_step = Storage.get('selected_step');
    };

    $scope.itemOnLongPress = function (pstep) {
        console.log("Long Press event. For step: " + JSON.stringify(pstep.id));
    };

    $scope.itemOnTouchEnd = function (pstep) {
        console.log("Touch end event. For step: " + JSON.stringify(pstep.id));
    };

    $scope.openStep = function (pstep) {
        if (pstep.id != 'WARN') {
            console.log('Displaying step');
            Storage.set('selected_step', pstep);
            $scope.selected_step = pstep;
            console.log('selected step is: ' + Storage.get('selected_step').id);
        }
    }

    $scope.openProc = function (proc) {
        console.log('Opening proc: ' + JSON.stringify(proc.name))
        Storage.set('procedure', JSON.parse($scope.data[proc.name + '.json']));
        $location.path('details');
    };

    $scope.goBack = function () {
        Storage.set('procedure', null);
        Storage.set('selected_step', null);
        $location.path('');
    };

    $scope.readDBJsonFiles = function () {
        console.log('Reading JSON files from DB.');
        $http({
            url: 'https://hybrid-proc.herokuapp.com/procList',
            method: 'GET',
            headers: { 'Content-Type': '*/*' }
        }).then(function (response) {
            // console.log('SUCCESS: ' + JSON.stringify(response));
            console.log('JSON Files read.');
            Storage.set('data', response.data);
            var procListStr = response.data.list + '';
            var procList = procListStr.split(',');
            var i = 1;
            var procListJson = [];
            procList = procList.map(proc => procListJson.push({ "id": i++, "name": proc.slice(0, -5) }));
            Storage.set('proclist', procListJson);
            console.log('JSON Data and Procedure list is set in LocalStorage.');
        }, function (response) {
            console.log('ERROR: ' + JSON.stringify(response));
        });
    }

    $scope.resetLocalStorage = function () {
        console.log('clearing all local storage data...');
        Storage.removeAll();
    };

    $scope.toggleUpload = function () {
        $scope.fileUpload = !$scope.fileUpload;
    }

    $scope.modalInstance = {};

    $scope.openUploadModal = function (data) {
        $scope.modalInstance = $modal.open({
            templateUrl: 'partials/upload.modal.html',
            controller: 'index',
            resolve: {
                data: function () {
                    return data === null ? {} : data;
                }
            }
        }).result.then(function () { }, function (res) { });
    };

    $scope.openVideoModal = function (data) {
        $scope.modalInstance = $modal.open({
            templateUrl: 'partials/video.partial.html',
            controller: 'index',
            resolve: {
                data: function () {
                    return data === null ? {} : data;
                }
            }
        }).result.then(function () { }, function (res) { });
    };

    $scope.openImageModal = function (data) {
        $scope.modalInstance = $modal.open({
            templateUrl: 'partials/image.partial.html',
            controller: 'index',
            resolve: {
                data: function () {
                    return data === null ? {} : data;
                }
            }
        }).result.then(function () { }, function (res) { });
    };

    $scope.openAudioModal = function (data) {
        $scope.modalInstance = $modal.open({
            templateUrl: 'partials/audio.partial.html',
            controller: 'index',
            resolve: {
                data: function () {
                    return data === null ? {} : data;
                }
            }
        }).result.then(function () { }, function (res) { });
    };

    $scope.cleanPath = function (path) {
        // This is needed if media files are Youtube or any other external links.
        return $sce.trustAsResourceUrl(path);
    };

    $scope.originatorEv = {};

    $scope.openMenu = function ($mdMenu, ev) {
        originatorEv = ev;
        $mdMenu.open(ev);
    };

    $scope.markComplete = function (step) {
        $scope.openStep(step);
        console.log('Marking Step: ' + step.id + ' as Complete');
    };

    $scope.markFailed = function (step) {
        $scope.openStep(step);
        console.log('Marking Step: ' + step.id + ' as Failed');
    };

    $scope.addImage = function (step) {
        $scope.openStep(step);
        console.log('Adding Image for step: ' + step.id);
        $scope.openImageModal();
    };

    $scope.addVideo = function (step) {
        $scope.openStep(step);
        console.log('adding Video for Step: ' + step.id);
        $scope.openVideoModal();
    };

    $scope.addAudio = function (step) {
        $scope.openStep(step);
        console.log('adding Audio for Step: ' + step.id);
        $scope.openAudioModal();
    };

    $scope.addComment = function (step) {
        $scope.openStep(step);
        console.log('Adding comment for step: ' + step.id);
    };

}]);

app.directive('onLongPress', function ($timeout) {
    return {
        restrict: 'A',
        link: function ($scope, $elm, $attrs) {
            $elm.bind('touchstart', function (evt) {
                // Locally scoped variable that will keep track of the long press
                $scope.longPress = true;

                // We'll set a timeout for 600 ms for a long press
                $timeout(function () {
                    if ($scope.longPress) {
                        // If the touchend event hasn't fired,
                        // apply the function given in on the element's on-long-press attribute
                        $scope.$apply(function () {
                            $scope.$eval($attrs.onLongPress)
                        });
                    }
                }, 600);
            });

            $elm.bind('touchend', function (evt) {
                // Prevent the onLongPress event from firing
                $scope.longPress = false;
                // If there is an on-touch-end function attached to this element, apply it
                if ($attrs.onTouchEnd) {
                    $scope.$apply(function () {
                        $scope.$eval($attrs.onTouchEnd)
                    });
                }
            });
        }
    };
});
