'use strict';

/**
 * Master module
 */

var HiveMindHealth = angular.module('HiveMindHealth', ['ngRoute']);

/**
 * Routes
 */

HiveMindHealth.config(function($routeProvider, $locationProvider) {
  // prevent the # in the url bar and enable the html5 history api
  //  if available
  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('!');
  $routeProvider
    .when('/',              { controller: 'ResultsController',
                              templateUrl: '/results' })
    .when('/s/:searchTerm', { controller: 'ResultsController',
                              templateUrl: '/results' })
    .otherwise({ redirectTo: '/' });
});

/**
 * Controllers
 */

/**
 * SearchController
 *
 * @description Handles search processing, shrinking the jumbotron, and
 *  switching to the results tab after an initial search
 */

HiveMindHealth.controller('SearchController', function($scope, $http, $location, tabService) {
  // initialize state
  $scope.tabs   = {};
  $scope.search = {};

  // show the resources tab by default
  tabService.showResources($scope.tabs);

  /**
   * doSearch
   *
   * @description Handles search processing, shrinking the jumbotron, and
   *  switching to the results tab after an initial search
   */

  $scope.doSearch = function() {
    // return if the form is empty
    if ($scope.search.search_term === undefined) {
      return;
    }

    // strip leading/trailing spaces and return if length=0
    if (typeof $scope.search.search_term === 'string') {
      $scope.search.search_term.replace(/^\s+|\s+$/g, '');
      if ($scope.search.search_term.length === 0) {
        return;
      }
    }

    // collapse the jumbotron
    $scope.hideJumbo = true;

    $http.get('/search/' + $scope.search.search_term)
      .success(function(data) {
        $location.path('/s/' + $scope.search.search_term);
        // switch to the results taB
        tabService.showResults($scope.tabs);
        $scope.search_results = data;
      })
    ;  
  };
});

/**
 * ResultsController
 *
 * @description Child of SearchController, currently handles
 *  tab switching, and direct-to-result browswer navagation; history
 *  click for example.
 */

HiveMindHealth.controller('ResultsController', function($scope, tabService, $routeParams) {
  // Set UI tab switch actions
  $scope.showResources = function() {
    tabService.showResources($scope.tabs);
  };
  $scope.showResults   = function() {
    tabService.showResults($scope.tabs);
  };

  // On new(), look for and handle history click / browser navigation direct to result view
  if ($routeParams && $routeParams.searchTerm 
      && (! $scope.search_results || $routeParams.searchTerm !== $scope.search.search_term)) {
    $scope.search.search_term = $routeParams.searchTerm;
    $scope.doSearch();
  }
});

/**
 * Services
 */

/**
 * tabService
 *
 * @description Singleton that returns an object containing
 *  tab switching functions.
 */

HiveMindHealth.factory('tabService', function() {
  var tabService = {};
 
  /**
   * showResults
   *
   * @description Switch to the results tab
   *
   * @param tabs {Object}    the tabs object to manipulate
   */

  tabService.showResults = function(tabs) {
    tabs['resourcesTab'] = false;
    tabs['resultsTab']   = true;
  };

  /**
   * showResources
   *
   * @description Switch to the resources tab
   *
   * @param tabs {Object}    the tabs object to manipulate
   */

  tabService.showResources = function(tabs) {
    tabs['resourcesTab'] = true;
    tabs['resultsTab']   = false;
  };

  return tabService;
});
