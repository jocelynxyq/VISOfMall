'use strict';

var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');

var dataController = require('./controllers/data');
var staticAssets = 'public';

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
// app.use(favicon(path.join(__dirname, 'public/favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')))

// Returns middleware that parses both json and urlencoded.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', dataController.getData);

app.get('/bar', dataController.getBar);

app.post('/barData', dataController.getBarData);


var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

