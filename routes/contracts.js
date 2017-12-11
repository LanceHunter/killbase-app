const env = 'development';
const config = require('../knexfile.js')[env];
const knex = require('knex')(config);

const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id')
  .then((result) => {
      res.send(result);
      knex.destroy();
    })
    .catch((err) => {
      console.error(err);
      knex.destroy();
      res.sendStatus(500);
    });
});



module.exports = router;
