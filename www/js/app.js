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

app.controller('index', ['$scope', '$location', 'Storage', '$http', '$modal', '$sce', '$interval', function ($scope, $location, Storage, $http, $modal, $sce, $interval) {

    $scope.data = {};
    $scope.proclist = {};
    $scope.procedure = {};
    $scope.selected_step = {};
    $scope.fileUpload = false;
    $scope.procNumber = {};
    $scope.completed_steps = {};
    $scope.flagged_steps={};

    $scope.init = function () {
        console.log('Init...');
        if (Storage.get('data')) {
            console.log('Stored data found.');
            $scope.data = Storage.get('data');
            $scope.proclist = Storage.get('proclist');
            $scope.completed_steps = Storage.get('completed_steps');
            if (typeof $scope.completed_steps == undefined || $scope.completed_steps == null) {
                $scope.completed_steps = {};
            }
            $scope.flagged_steps = Storage.get('flagged_steps');
            if (typeof $scope.flagged_steps == undefined || $scope.flagged_steps == null) {
                $scope.flagged_steps = {};
            }
        } else {
            console.log('No stored data found...  reading json files from DB.');
            $scope.readDBJsonFiles();
            console.log('Data is set');
            $scope.completed_steps = {};
            $scope.flagged_steps = {};
        }
        $scope.procedure = Storage.get('procedure');
        $scope.selected_step = Storage.get('selected_step');
        $scope.procNumber = Storage.get('procNumber');
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
        console.log('Opening proc: ' + JSON.stringify(proc.name));
        Storage.set('procNumber', proc.id);
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

    $scope.openCommentModal = function (data) {
        $scope.modalInstance = $modal.open({
            templateUrl: 'partials/comment.modal.html',
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
        if (step.id != 'WARN') {
            console.log('Marking Step: ' + step.id + ' as Complete');
            if (typeof $scope.completed_steps[$scope.procedure.name] == undefined || $scope.completed_steps[$scope.procedure.name] == null) {
                $scope.completed_steps[$scope.procedure.name] = [];
            }
            $scope.completed_steps[$scope.procedure.name].push(step.id);
            Storage.set('completed_steps', $scope.completed_steps[$scope.procedure.name]);
        }
    };

    $scope.markFailed = function (step) {
        $scope.openStep(step);
        if (step.id != 'WARN') {
            console.log('Marking Step: ' + step.id + ' as Failed');
            if (typeof $scope.flagged_steps[$scope.procedure.name] == undefined || $scope.flagged_steps[$scope.procedure.name] == null) {
                $scope.flagged_steps[$scope.procedure.name] = [];
            }
            $scope.flagged_steps[$scope.procedure.name].push(step.id);
            Storage.set('flagged_steps', $scope.flagged_steps[$scope.procedure.name]);
        }
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
        $scope.openCommentModal(step);
        console.log('Adding comment for step: ' + step.id);
    };

    $scope.initImageModal = function () {
        console.log('init image modal');
        $scope.procedure = Storage.get('procedure');
        $scope.selected_step = Storage.get('selected_step');
        $scope.procNumber = Storage.get('procNumber');
    };

    $scope.initVideoModal = function () {
        console.log('init video modal');
        $scope.procedure = Storage.get('procedure');
        $scope.selected_step = Storage.get('selected_step');
        $scope.procNumber = Storage.get('procNumber');
    };

    $scope.initAudioModal = function () {
        console.log('init audio modal');
        $scope.procedure = Storage.get('procedure');
        $scope.selected_step = Storage.get('selected_step');
        $scope.procNumber = Storage.get('procNumber');
    };

    $scope.imgSrc = '';
    $scope.imageSelected = function (elem) {
        console.log('image selected...');
        $scope.$apply(function (scope) {
            var photofile = elem.files[0];
            $scope.imgSrc = URL.createObjectURL(photofile);
            var reader = new FileReader();
            reader.onload = function (e) {
                // handle onload
                console.log('photofile h: ' + photofile);
                console.log('image file onload called. e aaya: ' + e);
            };
            reader.readAsDataURL(photofile);
        });
    };

    $scope.vidSrc = '';
    $scope.videoSelected = function (elem) {
        console.log('video selected...');
        $scope.$apply(function (scope) {
            var videoFile = elem.files[0];
            $scope.vidSrc = URL.createObjectURL(videoFile);
            var reader = new FileReader();
            reader.onload = function (e) {
                // handle onload
                console.log('videoFile h: ' + videoFile);
                console.log('video file onload called. e aaya: ' + e);
            };
            reader.readAsDataURL(videoFile);
        });
    };

    $scope.audSrc = '';
    $scope.audioSelected = function (elem) {
        console.log('audio selected...');
        $scope.$apply(function (scope) {
            var audioFile = elem.files[0];
            $scope.audSrc = audioFile;
            var reader = new FileReader();
            reader.onload = function (e) {
                // handle onload
                console.log('audioFile h: ' + audioFile);
                console.log('audio file onload called. e aaya: ' + e);
            };
            reader.readAsDataURL(audioFile);
        });
    };

    //Stop Watch
    $scope.sharedTime = new Date();
    $interval(function () {
        $scope.sharedTime = new Date();
    }, 500);

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

app.directive('stopwatch', function () {
    return {
        restrict: 'AE',
        templateUrl: 'stopwatch.html',
        scope: {
            title: '@title',
            currentTime: '=time'
        },
        link: function (scope, element, attrs, ctrl) {

        },

        controllerAs: 'swctrl',
        controller: function ($scope, $interval) {
            console.log("Directive's controller");
            var self = this;
            var totalElapsedMs = 0;
            var elapsedMs = 0;
            var startTime;
            var timerPromise;

            self.start = function () {
                if (!timerPromise) {
                    startTime = new Date();
                    timerPromise = $interval(function () {
                        var now = new Date();
                        elapsedMs = now.getTime() - startTime.getTime();
                    }, 31);
                }
            };

            self.stop = function () {
                if (timerPromise) {
                    $interval.cancel(timerPromise);
                    timerPromise = undefined;
                    totalElapsedMs += elapsedMs;
                    elapsedMs = 0;
                }
            };

            self.lap = function () {
                if (timerPromise) {
                    return totalElapsedMs;
                } else {
                    return;
                }
            };

            self.reset = function () {
                startTime = new Date();
                totalElapsedMs = elapsedMs = 0;
                $scope.lapVal = 0;
            };

            self.getTime = function () {
                return time;
            };

            $scope.lapVal = 0;
            $scope.printLap = function (t) {
                $scope.lapVal = $scope.lapVal + '\n' + t;
                console.log('time is: ' + t);
            }

            self.getElapsedMs = function () {
                if (totalElapsedMs) {
                    return totalElapsedMs + elapsedMs;
                } else {
                    return elapsedMs;
                }
            };
        }
    }
});

window.addEventListener("load",function() {
    setTimeout(function(){
        // This hides the address bar:
        window.scrollTo(0, 1);
    }, 0);
});
