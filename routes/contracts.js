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
  knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id')
  .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

router.get('/total', (req, res) => {
  knex('contracts').countDistinct('id')
  .then ((result) => {
    res.send(result[0]);
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  })
})


router.get('/:id', (req, res) => {
  let idRange = [];
  let id = filterInt(req.params.id);
  if (!isNaN(id)) {
    knex.select('id').from('contracts')
    .then((idArr) => {
      for (i=0; i<idArr.length; i++) {
        idRange.push(idArr[i].id);
      }
    })
    .then(() => {
      if (idRange.includes(id)) {
        knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').where('contracts.id', id)
        .then((result) => {
            res.send(result);
        });
      } else {
        res.sendStatus(404);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(404);
  }
});

router.delete('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let idRange = [];
  if (!isNaN(id)) {
    knex.select('id').from('contracts')
    .then((idArr) => {
      for (i=0; i<idArr.length; i++) {
        idRange.push(idArr[i].id);
      }
    })
    .then(() => {
      if (idRange.includes(id)) {
        knex('contracts').where('id',id).del()
        .then((result) => {
            res.sendStatus(200);
        })
      } else {
        res.sendStatus(404);
      }
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(404);
  }
});


module.exports = router;
