'use strict';

const env = 'development';
const config = require('../knexfile.js')[env];
const knex = require('knex')(config);

const express = require('express');
const router = express.Router();

const filterInt = function(value) {
    if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
      return Number(value);
    return NaN;
  };


router.get('/', (req, res) => {
  knex.select().from('assassins')
  .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  if (!isNaN(id)) {
    knex.select('*').from('assassins').where('id', id)
    .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
  }
});

router.get('/names/:id', (req, res) => {
  let name = req.params.id;
  knex.select('*').from('assassins').where('name', name)
  .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/codenames/:id', (req, res) => {
  let codeName = req.params.id;
  console.log(codeName);
  knex.select('*').from('code_names').fullOuterJoin('assassins', 'code_names.assassin_id', 'assassins.id').where('code_names.code_name', codeName)
  .then((result) => {
    res.send(result);
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});

router.post('/', (req, res) => {
  let assassinObj = req.body;
  console.log(assassinObj);
  knex('assassins').insert(assassinObj)
  .then((result) => {
    res.send(result);
  })
  .catch((err) => {
    console.error(err);
    res.sentStatus(500);
  });
});

router.delete('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  if (!isNaN(id)) {
    knex('code_names').where('assassin_id',id).del()
    .then(() => {
      return knex('weapons').where('assassin_id',id).del();
    })
    .then(() => {
      return knex('assassins').where('id', id).del()
      .then((result) => {
          res.sendStatus(200);
        })
        .catch((err) => {
          console.error(err);
          res.sendStatus(500);
        });
    })
  }
});




module.exports = router;