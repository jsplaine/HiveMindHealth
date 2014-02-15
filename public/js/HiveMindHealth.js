'use strict';

/**
 * Master module
 */

var HiveMindHealth = angular.module('HiveMindHealth', ['ngRoute', 'ui.bootstrap']);

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
                              templateUrl: '/results',
                              // this forces the controller not to be available
                              //  until config data (apiInfo.data) is populated
                              resolve: { 
                                'apiInfoData': function(apiInfo) {
                                  return apiInfo.promise;
                                }
                              }
                            })
    .otherwise({ redirectTo: '/' });
});

/**
 * run block scrollTo()
 *
 * @description Defines global $rootScope.scrollTo(dest)
 */

HiveMindHealth.run(function ($rootScope, $location, $anchorScroll) {
  $rootScope.scrollTo = function(dest) {
    $location.hash(dest);
    $anchorScroll();
    // ditch the url anchor hash
    $location.hash("");
  };
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

HiveMindHealth.controller('SearchController', function($scope, $location, tabService, 
                                                       searchService, apiInfo) {
  // initialize state
  $scope.tabs           = {};
  $scope.search         = {};
  $scope.search_results = {};

  // careful -- populated asynchronously
  $scope.apiInfo = apiInfo;

  // show the resources tab by default
  tabService.showResources($scope.tabs);

  /**
   * showJumbo
   *
   * show the jumboTron
   */

  $scope.showJumbo = function() {
    $scope.hideJumbo = false;
  }

  /**
   * doSearch
   *
   * @description Handles search processing, shrinking the jumbotron, and
   *  switching to the results tab after an initial search
   */

  $scope.doSearch = function() {
    // return if search doesn't validate
    if (! searchService.trimAndCheck($scope.search)) {
      return;
    }
    
    // switch to the results tab and remove focus from text input (also 
    //  closes soft keyboards)
    tabService.showResults($scope.tabs);
    // XXX find a better way XXX
    $('input[placeholder=Search]').blur();

    // collapse the jumbotron
    $scope.hideJumbo = true;

    // trigger get requests against each API
    searchService.searchAPIs(apiInfo.data, $scope.search.search_term, 
                               $scope.search_results, function(data) {
      $location.path('/s/' + $scope.search.search_term);
    })
  }
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

  // On new(), look for and handle history click / browser navigation direct-to-result view
  if ($routeParams && $routeParams.searchTerm 
      && ($scope.search_results === {} || $routeParams.searchTerm !== $scope.search.search_term)) {
    $scope.search.search_term = $routeParams.searchTerm;
    $scope.doSearch();
  }
});

/**
 * Services
 */

/**
 * apiInfo
 *
 * @description Singleton which returns an object containing an API
 *  information object, and a promise which, only when resolved,
 *  indicates that the API information object has been populated.
 */

HiveMindHealth.service('apiInfo', function($http, $q) {
  var retry    = 10,
      deferred = $q.defer(),
      apiInfo  = { 
        promise: deferred.promise
      };

  // set api info data
  $http.get('/apiInfo', { cache: true })
    .success(function(res) {
      apiInfo.data = res;
      deferred.resolve();
    })
  ;

  return apiInfo;
});

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

/*
 * searchService
 *
 * @description Singleton that deals with various aspects of searching,
 *  including search term validation and http search calls
 */

HiveMindHealth.factory('searchService', function($http) {
  var searchFactory = {};

  /*
   * trimAndCheck
   *
   * @description validate the search object
   *
   * @param search    the search term
   * @returns true if search_term field is a non-empty string
   */

  searchFactory.trimAndCheck = function(search) {
    if (search.search_term === undefined || typeof search.search_term !== 'string') {
      return false;
    }
    // strip leading/trailing spaces and return if length=0
    search.search_term.replace(/^\s+|\s+$/g, '');
    if (search.search_term.length === 0) {
      return false;
    }
    return true;
  };

  /*
   * searchAPIs
   *
   * @description trigger a search against each given api
   *
   * @param apis          the list of APIs to call
   * @param searchTerm    the search term
   * @param searchResults the search results object to populate
   * @param callB         the callback, to be called after each successful
   *                        API search
   */

  searchFactory.searchAPIs = function(apis, searchTerm, searchResults, callB) {
    for (var i = 0, len = apis.length; i < len; i++) {
      var api = apis[i];

      // skip inactive apis
      if (api.data.active !== true) {
        continue;
      }

      var apiName            = apis[i].name;
      searchResults[apiName] = { inProgress: true }; 
      
      var getResults = function(apiName, searchResults) {
        $http.get('/search/' + apiName + '/' + searchTerm, { cache: true })
          .success(function(data) { 
            // note that this removes the inProgress flag
            searchResults[apiName] = data;
            callB();
          })
        ;  
      };

      getResults(apiName, searchResults);
    }
  };

  return searchFactory;
});

/*
 * Directives
 */

/*
 * resultBlock
 *
 * @description Defines and returns an angular directive that
 *  deals with assigning the matching html element to an
 *  API-type-specific result block.
 * 
 * @returns the resultBlock directive
 */

HiveMindHealth.directive('resultBlock', function() {
  return {
    restrict: 'C',
    scope: {
      result : '=',
    },
    template: '<div ng-include="getTemplateUrl()"></div>',
    controller: ['$scope', function ($scope) { 
      $scope.getTemplateUrl = function () { 
        return '/result/' + $scope.result.type + '-result';
      }; 
    }]
  };
});
