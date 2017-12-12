'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 8888;

const assassinsRoute = require('./routes/assassins.js');
const contractsRoute = require('./routes/contracts.js');

app.disable('x-powered-by');

app.use(bodyParser.json());

app.use('/assassins', assassinsRoute);
app.use('/contracts', contractsRoute);

app.use((req,res) => {
  res.sendStatus(404);
});

app.listen(port, () => {
  console.log('Listening on port', port);
});


module.exports = app;
