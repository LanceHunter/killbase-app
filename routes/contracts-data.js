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
  knex('contracts').countDistinct('contract_set_id')
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
          knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').where('contracts.contract_set_id', id)
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
          knex.select('client_name').from('clients').where('id', id)
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

// For POST requests to /contracts - This will take the body of the request and first check to see if the client is in our client list. Then it creates a target, then if the client is not already in our list then it creates a new client. If the client is already in our list then it gets the id for that client. Finally, it create contract for that target and client and sends the JSON for the join table of contract+target.
router.post('/', (req, res) => {
  let bodyObj = req.body;
  let targetID;
  let clientID;
  let clientArr = [];
  let targetObj = {
    'name' : bodyObj.target_name,
    'location' : bodyObj.location,
    'photo_url' : bodyObj.photo_url,
    'security_level' : bodyObj.security_level
  };
  let clientObj = {
    'client_name' : bodyObj.client_name
  }
  knex.select('name').table('clients')
  .then((results) => {
    console.log(results);
    for (let i=0; i<results.length; i++) {
      clientArr.push(results[i].name);
    }
    return knex('targets').insert(targetObj).returning('id')
  })
  .then((target_id) => {
    targetID = target_id[0];
    if (clientArr.includes(bodyObj.client_name)) {
      console.log('Name not found.')
      return knex.select('id').from('clients').where('client_name', bodyObj.client_name);
    } else {
      console.log('Name found')
      return knex('clients').insert({name:bodyObj.client_name}).returning('id');
    }
  })
  .then((client_id) => {
    let clientID = client_id[0].id || client_id[0];
    console.log("Target id = " + targetID);
    console.log("Client id = " + clientID);
    let contractObj = {
      'target_id' : targetID,
      'client_id' : clientID,
      'budget' : bodyObj.budget
    };
    console.log(contractObj);
    return knex('contracts').insert(contractObj).returning('id');
  })
  .then((contract_id) => {
    return           knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').where('contracts.contract_set_id', contract_id[0]);
  })
  .then((response) => {
    res.send(response);
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});


// For PATCH requests to /contracts/targets - This will need to include an id in the path and the information to be updated in the body of the request.
router.patch('/targets/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let targetObj = req.body;
  let idRange = [];
  if (!isNaN(id)) {
    knex.select('id').from('targets')
      .then((idArr) => {
        for (let i = 0; i < idArr.length; i++) {
          idRange.push(idArr[i].id);
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          if (targetObj.name) {
            console.log('Name change');
            knex('targets').where('id',id).update({
              "name" : targetObj.name
            })
            .catch((err) => {
              console.error('Name error - ' + err);
              res.sendStatus(500);
            })
          }
          if (targetObj.location) {
            console.log('Location change');
            knex('targets').where('id',id).update({
              "location" : targetObj.location
            })
            .catch((err) => {
              console.error('Location error - ' + err);
              res.sendStatus(500);
            })
          }
          if (targetObj.photo_url) {
            console.log('Photo URL change');
            knex('targets').where('id',id).update({
              "photo_url" : targetObj.photo_url
            })
            .catch((err) => {
              console.error('Photo URL error - ' + err);
              res.sendStatus(500);
            })
          }
          if (targetObj.security_level) {
            console.log('Security level change');
            knex('targets').where('id',id).update({
              "security_level" : targetObj.security_level
            })
            .catch((err) => {
              console.error('security level error - ' + err);
              res.sendStatus(500);
            })
          }
          res.send(targetObj);
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

// For PATCH requests to /contracts - This will need to include an id in the path and the information to be updated in the body of the request. If the ID doesn't match any current contract ids, a 404 is sent. This currently expects that any attempts to update the contract to completed will also include the id of the assassin that completed it. It will also change the target "alive" value to false if a contract is completed. The only other updates allowed currently are to the budget.
router.patch('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let contractObj = req.body;
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
          if (contractObj.completed) {
            console.log('Contract completed');
            knex('contracts').where('id',id).update({
              "completed" : contractObj.completed,
              "completed_by" : contractObj.completed_by
            }).returning('target_id')
            .then((target_id) => {
              console.log(target_id);
              return knex('targets').where('id',target_id[0]).update({
                "alive" : !contractObj.completed
              })
            })
            .then(() => {
              res.sendStatus(200);
            })
          }
          if (contractObj.budget) {
            console.log('Budget updated');
            knex('contracts').where('id',id).update({
              "budget" : contractObj.budget
            })
            .then(() => {
              res.sendStatus(200);
            })
          }
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
