/*
 * dependencies
 */

var express = require('express'),
    // this should really be some sort of search module that uses a factory
    apis    = require('./api/factory');

/*
 * create server
 */

var app = module.exports = express();

/*
 * settings and configuration
 */

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.set('view options', { layout: false });

app.use(express.static(__dirname + '/public/'));
app.use(express.favicon(__dirname + '/public/img/favicon.ico'));

app.use(express.json());
app.use(app.router);

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, 
                                   showStack:      true }));
});

app.configure('production', function(){
    app.use(express.errorHandler());
    app.enable('view cache');
});

// Error handling defined last
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, 'Something broke!');
});

/*
 * routes
 */

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/results', function(req, res) {
  res.render('partials/results');
});

app.get('/result/:resultType', function(req, res) {
  res.render('partials/' + req.params.resultType);
});

app.get('/s/:searchTerm', function(req, res) {
  res.render('index');
});

// local services
app.get('/search/:apiName/:searchTerm', apis.getResults);
app.get('/apiInfo',                     apis.getInfo);

// redirect all others to the index
app.get('*', function(req, res) {
  res.render('index');
});

/*
 * listen 
 * 
 * XXX todo, pull from process.port || $PORT
 */

app.listen('13672');
