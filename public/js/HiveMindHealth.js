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

HiveMindHealth.controller('SearchController', function($scope, $location, $timeout, 
                                                       tabService, searchService, apiInfo) {
  // initialize state
  $scope.tabs           = {};
  $scope.search         = {};
  $scope.search_results = {};

  // careful -- populated asynchronously
  $scope.resource_info  = apiInfo;

  // show the resources tab by default
  tabService.showResources($scope.tabs);

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
    
    // catch the case where we're doing a search before apiInfo
    //  has had time to populate
    // XXX fix potention deep recursion
    if (apiInfo.apis === undefined) {
      $timeout(function() {
        $scope.doSearch();
      }, 200);
      return;
    }

    // switch to the results tab
    tabService.showResults($scope.tabs);

    // collapse the jumbotron
    $scope.hideJumbo = true;

    // trigger get requests against each API
    searchService.searchAPIs(apiInfo.apis, $scope.search.search_term, 
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
 * @description Singleton 'value' that is an object containing
 *  API resource info for each API.
 *
 * note:  That which depends on apiInfo may have to check to see that
 *  its data field is defined before relying on it.  apiInfo.apis is set
 *  asynchronously.
 */

HiveMindHealth.factory('apiInfo', function($http, $timeout) {
  var retry   = 10,
      apiInfo = {};

  // set api info
  (function getApiInfo() {
    $http.get('/apiInfo', { cache: true })
      .success(function(res) {
        apiInfo.apis = res;
      })
      .error(function() {
        if (retry > 0) {
          getApiInfo();
          retry--;
        }
      })
    ;
  })();
  
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
      if (api.data.active !== true) {
        // skip inactive apis
        continue;
      }

      var apiName            = apis[i].name;
      searchResults[apiName] = { inProgress: true }; 
       
      $http.get('/search/' + apiName + '/' + searchTerm, { cache: true })
        .success(function(data) { 
          // note that this removes the inProgress flag
          searchResults[apiName] = data;
          callB();
         })
      ;  
    }
  };

  return searchFactory;
});
