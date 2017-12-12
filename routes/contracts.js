'use strict';

//Setting up knex
const env = 'development';
const config = require('../knexfile.js')[env];
const knex = require('knex')(config);

//Setting up express routing
const express = require('express');
const router = express.Router();


// filterInt - The function from MDN that confirms a particular value is actually an integer. Because parseInt isn't quite strict enough.
const filterInt = function(value) {
  if (/^(\-|\+)?([0-9]+|Infinity)$/.test(value))
    return Number(value);
  return NaN;
};

// For a GET request to the main contracts route, /contracts - This will return JSON for all contracts with their target information included.
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

// For a GET request to the route /contracts/total - This will return a JSON object with key "count" whose value is equal to the total number of contracts.
router.get('/total', (req, res) => {
  knex('contracts').countDistinct('id')
    .then((result) => {
      res.send(result[0]);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    })
});

// For a GET request to the route /contracts/targets/ that then passes a name value to be searched. - This will return a JSON object with the contract and target information.
router.get('/targets/:id', (req, res) => {
let name = req.params.id;
let namesRange = [];
knex.select('name').from('targets')
  .then((nameArr) => {
    console.log(nameArr);
    for (let i = 0; i < nameArr.length; i++) {
      namesRange.push(nameArr[i].name);
    }
  })
  .then(() => {
    if (namesRange.includes(name)) {
      knex.select('id').from('targets').where('name', name)
        .then((result) => {
          return knex.select('*').from('targets').fullOuterJoin('contracts', 'targets.id', 'contracts.target_id').where('targets.id', result[0].id);
        })
        .then((result) => {
          res.send(result);
        })
    } else {
      res.sendStatus(404);
    }
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});


// For a GET request to the route /contracts that includes an id. - This will return JSON of the join table between the contract with the matching id and its target.
router.get('/:id', (req, res) => {
  let idRange = [];
  let id = filterInt(req.params.id);
  if (!isNaN(id)) {
    knex.select('id').from('contracts')
      .then((idArr) => {
        for (let i = 0; i < idArr.length; i++) {
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

// For a GET request to the route /contracts/clients/ that includes an id. - This will return JSON of an object containing the key "name" whose value is the name of the client whose ID matches the one provided.
router.get('/clients/:id', (req, res) => {
  let idRange = [];
  let id = filterInt(req.params.id);
  if (!isNaN(id)) {
    knex.select('id').from('clients')
      .then((idArr) => {
        for (let i = 0; i < idArr.length; i++) {
          idRange.push(idArr[i].id);
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          knex.select('name').from('clients').where('id', id)
            .then((result) => {
              res.send(result[0]);
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

// For a POST request to /contracts/assign - This requires that there be an assassin_id and a contact_id in the body. It assigns a contract to an assassin.
router.post('/assign', (req, res) => {
  let assignmentObj = req.body;
  if (assignmentObj.assassin_id && assignmentObj.contract_id) {
    knex('assassins_contracts').insert({
      "assassin_id" : assignmentObj.assassin_id,
      "contract_id" : assignmentObj.contract_id
    })
    .then(() => {
      //Sending 200 if it works. Will need to update this to be more relevant later.
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(400);
  }
});


// For a DELETE request to /contracts/assign - This requires that there be an assassin_id in the body. If there is also a contract_id it then deletes that row from the assassins_contracts table. If there is only an assassin_id, it deletes all contracts assigned to that assassin.
router.delete('/assign', (req, res) => {
  let assignmentObj = req.body;
  if (assignmentObj.assassin_id && assignmentObj.contract_id) {
    knex('assassins_contracts').where({
      "assassin_id" : assignmentObj.assassin_id,
      "contract_id" : assignmentObj.contract_id
    }).del()
    .then(() => {
      //This sends a 200 status if it works. Will need to update with more detail later.
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else if (assignmentObj.assassin_id) {
    knex('assassins_contracts').where({
      "assassin_id" : assignmentObj.assassin_id
    }).del()
    .then(() => {
      //This sends a 200 status if it works. Will need to update with more detail later.
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(400);
  }
});

// For a DELETE request to /contracts that then includes an id. It will delete the id for the contract whose id matches the one provided. If the id is not found or is not a number, a 404 is sent. If there is an error, a 500 is sent. If it works properly, a 200 is sent.
router.delete('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let idRange = [];
  if (!isNaN(id)) {
    knex.select('id').from('contracts')
      .then((idArr) => {
        for (let i = 0; i < idArr.length; i++) {
          idRange.push(idArr[i].id);
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          knex('contracts').where('id', id).del()
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
