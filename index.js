'use strict';

// Setting up express, path, and body parser.
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = process.env.PORT || 8888;

// Requiring the code for the assassins & contracts routes.
const assassinsRoute = require('./routes/assassins.js');
const contractsRoute = require('./routes/contracts.js');

// Disabling the x-powered-by: Express header, for security.
app.disable('x-powered-by');

// Parsing the body of the request.
app.use(bodyParser.json());

// Getting the assassins & contracts routs running.
app.use('/assassins', assassinsRoute);
app.use('/contracts', contractsRoute);
//app.use('/', mainRoute);

// Sending a 404 of someone tries to access root directory. This will likely change when front-end is set.
app.get('/', (req,res) => {
  res.sendFile( '/Users/lancehunter/galvanize/unit-2/killbase-app/html/index.html');
});

app.get('/images/:id', (req,res) => {
  let id = req.params.id;
  let fileString = '/Users/lancehunter/galvanize/unit-2/killbase-app/images/' + id;
  res.sendFile(fileString);
});

// Turning on listening on the specified port.
app.listen(port, () => {
  console.log('Listening on port', port);
});


module.exports = app;
