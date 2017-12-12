'use strict';

// Setting up express and body parser.
const express = require('express');
const bodyParser = require('body-parser');
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

// Sending a 404 of someone tries to access root directory. This will likely change when front-end is set.
app.use((req,res) => {
  res.sendStatus(404);
});

// Turning on listening on the specified port.
app.listen(port, () => {
  console.log('Listening on port', port);
});


module.exports = app;
