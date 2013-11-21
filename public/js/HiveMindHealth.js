'use strict';

/**
 * Master module
 */

var HiveMindHealth = angular.module('HiveMindHealth', ['ngRoute']);

/**
 * Routes
 */

HiveMindHealth.config(function($routeProvider) {
  $routeProvider
    .when('/', { controller: 'SearchController',
                 templateUrl: 'resources' })
    .when('/results', { controller: 'SearchController',
                        templateUrl: 'resources' })
    .otherwise({ redirectTo: '/' });
});

// sharedService! http://www.youtube.com/watch?v=1OALSkJGsRw

/**
 * Controllers
 */

// Search controller
HiveMindHealth.controller('SearchController', function($scope, $rootScope, $http) {
  // $rootScope.$on($routeChangeStart, function(event, next, current) {
  //   $scope. do shit like show that something is loading
  //    or say switch the tab $on($routeChangeComplete)
  // http://www.youtube.com/watch?v=P6KITGRQujQ&list=UUKW92i7iQFuNILqQOUOCrFw&index=4&feature=plcp ??
  // }

  $rootScope.resourcesTab = true;
  $rootScope.resultsTab   = false;

  $scope.search = function() {
    console.log('in SearchController::search(), search: ' + $scope.search_term);
    $http.post('/search', { "search_term": $scope.search_term })
      .success(function(data) {
        // $scope.search_results = JSON.stringify(data);
        $rootScope.search_results = data;

        // switch tabs
        $rootScope.resourcesTab = false;
        $rootScope.resultsTab   = true;
      })
    ;                                             
  };
});

// Results controller
HiveMindHealth.controller('ResultsController', function($scope) {
  // Todo
});

// Resources controller
HiveMindHealth.controller('ResourcesController', function($scope) {
});

/**
 * Factories
 */

// HiveMindHealth.factory('Search', function() {
// 
// });

// HiveMindHealth.factory('FatSecret', function($resource) {
//   return $resource(
//     '/api/fatsecret/:search', 
//     { search: '@search' }, 
//     { update: { method: 'PUT' } }
//   );
// };
