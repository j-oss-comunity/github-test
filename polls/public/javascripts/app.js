// Angular module, defining routes for the app
var pollsModule = angular.module('polls', ['pollServices']).
	config(['$routeProvider', function($routeProvider) {
		$routeProvider.
			when('/polls', { templateUrl: 'partials/list.html', controller: PollListCtrl }).
			when('/poll/:pollId', { templateUrl: 'partials/item.html', controller: PollItemCtrl }).
			when('/new', { templateUrl: 'partials/new.html', controller: PollNewCtrl }).
			// If invalid route, just redirect to the main list view
			otherwise({ redirectTo: '/polls' });
	}]);

// directive for input type="file"
pollsModule.directive("fileread", [function () {
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    scope.$apply(function () {
                        scope.fileread = loadEvent.target.result;
                    });
                }
                reader.readAsDataURL(changeEvent.target.files[0]);
            });
        }
    }
}]);
