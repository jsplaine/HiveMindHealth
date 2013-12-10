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
    .when('/', { controller: 'ResultsController',
                 templateUrl: 'results' })
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

HiveMindHealth.controller('SearchController', function($scope, $http, tabService) {
  $scope.tabs = {};

  $scope.search = function() {
    // return if the form is empty
    if ($scope.search_term === undefined) {
      return;
    }

    // strip leading/trailing spaces and return if length=0
    if (typeof $scope.search_term === 'string') {
      $scope.search_term.replace(/^\s+|\s+$/g, '');
    }
    if ($scope.search_term.length === 0) {
      return;
    }

    // collapse the jumbotron
    $scope.hideJumbo = true;

    $http.get('/search/' + $scope.search_term)
      .success(function(data) {
        // switch to the results tab
        tabService.switchTab($scope.tabs, 'results');
        $scope.search_results = data;
      })
    ;  
  };
});

/**
 * ResultsController
 *
 * @description Child of SearchController, currently just handles
 *  tab switching. This controller has plenty of work in its 
 *  future, like helping users interact with search results.
 */

HiveMindHealth.controller('ResultsController', function($scope, tabService) {
  // show the default tab
  tabService.switchTab($scope.tabs);

  $scope.showResults   = function() {
    tabService.switchTab($scope.tabs, 'results');
  }

  $scope.showResources = function() {
    tabService.switchTab($scope.tabs, 'resources');
  }
});

/**
 * Services
 */

/**
 * tabService
 *
 * @description Singleton that returns an object containing a
 *  switchTab() function. Currently sets the 'resources' tab
 *  as the default.
 */

HiveMindHealth.factory('tabService', function() {
  var tabService = {},
      lastTab    = 'resources';
  
  /**
   * switchTab
   *
   * @description Switches to the given named tab, or if undefined
   *  the name of the last tab visited which defaults to 'resources'
   *
   * @param scope {Object}   the scope object to act upon
   * @oparam tab {String}    optional tab to switch to
   */

  tabService.switchTab = function(tabs, tab) {
    if (typeof tab === "undefined" || typeof tab !== "string") {
      tab = lastTab;
    }

    switch (tab.toLowerCase()) { 
      case "results": 
        showResults(tabs);
        break;

      case "resources":
        showResources(tabs);
        break;

      default:
        tabsService.switchTab(tabs, lastTab)
    }
  }

  return tabService;

  function showResults(tabs) {
    tabs['resourcesTab'] = false;
    tabs['resultsTab']   = true;
    lastTab = "results";
  };

  function showResources(scope) {
    scope['resourcesTab'] = true;
    scope['resultsTab']   = false;
    lastTab = "resources";
  };
});

// HiveMindHealth.factory('FatSecret', function($resource) {
//   return $resource(
//     '/api/fatsecret/:search', 
//     { search: '@search' }, 
//     { update: { method: 'PUT' } }
//   );
// };
