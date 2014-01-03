'use strict';

// TODO: - Search with special characters
//       - Tab switching scenarios
//       - Validate results after a non-'fresh' app load
 
describe('SearchController', function() {
  var scope,
      $httpBackend,
      mockResults; 

  // define our ng-app
  beforeEach(angular.mock.module('HiveMindHealth'));

  // inject dependencies
  beforeEach(angular.mock.inject(function($rootScope, $controller, _$httpBackend_) {
    scope        = $rootScope.$new();
    $httpBackend = _$httpBackend_;

    // define mock http behavior

    mockResults = getMockResults();

    $httpBackend.when('GET', '/search/bananas').respond(
      mockResults.bananas
    );

    $httpBackend.when('GET', '/search/gobbledyGuk').respond(
      mockResults.noResults
    );

    // declare the controller and inject our empty scope
    $controller('SearchController', { $scope: scope } );
  }));

  // check the mock http object -- if this fails, and an it() doesn't,
  //  there's something wrong.
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  // validate search behavior with a successful search
  describe('after a successful search', function() {
    beforeEach(function() {
      // do the search
      scope.search.search_term = "bananas";
      scope.doSearch();
      $httpBackend.flush()
    });

    it('should shrink the jumbotron', function() {
      expect(scope.hideJumbo).toBe(true);
    });

    it('should have switched to the resultsTab', function() {
      expect(scope.tabs.resultsTab).toBe(true);
      expect(scope.tabs.resourcesTab).toBe(false);
    });
  });

  // validate search behavior on a fresh app load, when the search string is empty
  describe('after submitting with an empty string in the search box', function() {
    beforeEach(function() {
      // do the search
      scope.search.search_term = "";
      scope.doSearch();
      // this helps us make sure our controller didn't bother calling
      //   the factory with an empty string.
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have shrunk the jumbotron', function() {
      expect(scope.hideJumbo).toBeFalsy();
    });

    it('should not have switched to the resultsTab', function() {
      // SearchController initializes tabs, defaulting to the resources tab
      expect(scope.tabs.resultsTab).toBeFalsy();
    });

    // if search_results are defined, the view will not behave correctly
    it('should have no search_results defined', function() {
      expect(scope.search_results).toBeUndefined();
    });

    it('should have no search_results defined', function() {
      expect(scope.search_results).toBeUndefined();
    });
  });

  // validate search behavior on a fresh app load but the search string is nonsensical
  describe('after submitting with a nonsensical search term', function() {
    beforeEach(function() {
      // do the search
      scope.search.search_term = "gobbledyGuk";
      scope.doSearch();
      $httpBackend.flush()
    });

    it('should shrink the jumbotron', function() {
      expect(scope.hideJumbo).toBe(true);
    });

    // not an empty form submit, so we're calling the APIs, thus we
    //  show, for each API, what the results where
    it('should have switched to the resultsTab', function() {
      expect(scope.tabs.resultsTab).toBe(true);
      expect(scope.tabs.resourcesTab).toBe(false);
    });

    it('should be displaying only api_info', function() {
      expect(typeof scope.search_results.api_info).toEqual("object");
    });

    it('should have results defined but length == 0', function() {
      expect(scope.search_results.results).toBeDefined();
      expect(scope.search_results.results.length).toEqual(0);
    });
  });
});

describe('ResultsController', function() {
  var scope,
      controller,
      searchCalled;

  // define our ng-app
  beforeEach(angular.mock.module('HiveMindHealth'));

  // inject dependencies
  beforeEach(angular.mock.inject(function($rootScope, $controller) {
    scope        = $rootScope.$new();
    searchCalled = false;
    controller   = $controller;

    // Mocking the behavior of ResultsController's parent
    scope.search   = {};
    scope.doSearch = function() { searchCalled = true; };
  }));

  describe('with routeParam searchTerm defined', function() {
    beforeEach(function() {
      // declare the controller
      controller('ResultsController', { 
        $scope       : scope,
        $routeParams : { searchTerm : "bananas" }
      });
    });
    it('should have called parent doSearch() function', function() {
      expect(scope.search.search_term).toEqual("bananas");
      expect(searchCalled).toBe(true);
    });
  });

  describe('with routeParam searchTerm not defined', function() {
    beforeEach(function() {
      // declare the controller
      controller('ResultsController', { 
        $scope       : scope,
        $routeParams : { foo : "bananas" }
      });
    });

    it('should have not called the parent doSearch() function', function() {
      expect(scope.search.search_term).toBeUndefined();
      expect(searchCalled).toBe(false);
    });
  });

  describe('with routeParam searchTerm defined but when results already exist', function() {
    beforeEach(function() {
      scope.search_results     = true;
      scope.search.search_term = "bananas";
      // declare the controller
      controller('ResultsController', { 
        $scope       : scope,
        $routeParams : { searchTerm : "bananas" }
      });
    });
    it('should have not called the parent doSearch() function', function() {
      expect(searchCalled).toBe(false);
    });
  });

  describe('with searchTerm defined and results exist for a different searchTerm', function() {
    beforeEach(function() {
      scope.search_results     = true;
      scope.search.search_term = "NOTbananas";
      // declare the controller
      controller('ResultsController', { 
        $scope       : scope,
        $routeParams : { searchTerm : "bananas" }
      });
    });
    it('should have called the parent doSearch() function', function() {
      expect(scope.search.search_term).toEqual("bananas");
      expect(searchCalled).toBe(true);
    });
  });
});

// Return a bunch of real-world-ish mock factory.js JSON results
function getMockResults() {
  return {
    "bananas": {
      "results": [
        {
          "id": "35755",
          "title": "Bananas",
          "url": "http:\/\/www.fatsecret.com\/calories-nutrition\/usda\/bananas",
          "unit": "Per 100g",
          "calories": "89kcal",
          "fat": "0.33g",
          "carbs": "22.84g",
          "protein": "1.09g"
        },
        {
          "id": "5388",
          "title": "Banana",
          "url": "http:\/\/www.fatsecret.com\/calories-nutrition\/generic\/banana-raw",
          "unit": "Per 100g",
          "calories": "89kcal",
          "fat": "0.33g",
          "carbs": "22.84g",
          "protein": "1.09g"
        },
      ],
      "api_info": {
        "print_name": "FatSecret",
        "api_url": "http:\/\/platform.fatsecret.com\/rest\/server.api",
        "api_url_link": "http:\/\/platform.fatsecret.com\/api",
        "site_url": "http:\/\/fatsecret.com",
        "quote_attr": "fatsecret.com",
        "quote": [
          "The FatSecret Platform API provides a suite of nutrition, exercise and weight management features that can easily be embedded in your web pages with JavaScript.",
          "We've made it as easy as adding a single line of JavaScript to your web pages to get a full, integrated application working for your site, together with a variety of functions and utilities for configuring and adjusting style, layout and presentation of the application on your web pages, and mechanisms for enabling deep integration with your existing website members and your site."
        ]
      } 
    },
    "noResults": {
      "results": [ ],
      "api_info": {
        "print_name": "FatSecret",
        "api_url": "http:\/\/platform.fatsecret.com\/rest\/server.api",
        "api_url_link": "http:\/\/platform.fatsecret.com\/api",
        "site_url": "http:\/\/fatsecret.com",
        "quote_attr": "fatsecret.com",
        "quote": [
          "The FatSecret Platform API provides a suite of nutrition, exercise and weight management features that can easily be embedded in your web pages with JavaScript.",
          "We've made it as easy as adding a single line of JavaScript to your web pages to get a full, integrated application working for your site, together with a variety of functions and utilities for configuring and adjusting style, layout and presentation of the application on your web pages, and mechanisms for enabling deep integration with your existing website members and your site."
        ]
      }
    }
  };
}


