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

// For a GET request to the main contracts route, /contracts - This will return a page showing all of the current contracts. THIS IS COMPLETE.
router.get('/', (req, res) => {
  knex.select('*').from('contracts').join('targets', 'contracts.target_id', 'targets.id').join('clients', 'contracts.client_id', 'clients.id') // Grabbing all contracts joined with their target and the client name.
  .then((result) => {
    res.render('../views/contracts.ejs', { // Then we send that to the multiple contracts page to get rendered.
      onMain : false,
      onAssassins : false,
      onContracts : true,
      search : false,
      contracts : result
    });
  })
  .catch((err) => { // If there's a database error, we send a 500 error.
    console.error(err);
    res.sendStatus(500);
  });
});

// For a GET request to /contracts/search. We first check to see if the target name or the code name is being searched. Then, depending on the search type, the name string provided by the user is searched. THIS IS COMPLETE.
router.get('/search', (req, res) => {
  let queryType = req.query.typeSearch; // The string for the type of search performed.
  let name = req.query.nameSearch; // The string that the user wants searched.
  if (queryType === `Target`) { // This is the logic for searching targets.
    let namesRange = []; // For holding the names of all targets. We'll compare against this later.
    knex.select('name').from('targets')
    .then((nameArr) => {
      nameArr.forEach((nameObj) => { // This grabs the target names out of their objects and puts their strings into the namesRange array.
        namesRange.push(nameObj.name);
      });
      let matchingNames = []; // An array of any names that match.
      // We now see if the name provided by the user matches any of the names in the database/namesRange array. For every case where it does, the target name is added to the new namesearch array.
      namesRange.forEach((fullName) => {
        if (fullName.toUpperCase().includes(name.toUpperCase())) {
          matchingNames.push(fullName);
        }
      });
      return knex('targets').fullOuterJoin('contracts', 'targets.id', 'contracts.target_id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('targets.name', matchingNames);
      // We are now doing a search for all targets whose name is in the array, and joining those results with the corresponding contract and client information.
    })
    .then((contracts) => {
      // Now we send the array of results to the multiple contrats page for rendering.
      res.render('../views/contracts.ejs', {
        onMain : false,
        onAssassins : false,
        onContracts : true,
        search : true,
        contracts : contracts
      });
    })
    .catch((err) => {
      // If there's a server error, we send a 500.
      console.error(err);
      res.sendStatus(500);
    });
  } else {
    //This is basically the same as above, but searching by Client Name instead of Name.
    let clientNameRange = []; // A fully-scoped array to be filled with client names.
    knex.select('client_name').from('clients')
    // Grabbing all the client names.
    .then((clientNameArr) => {
      clientNameArr.forEach((client) => {
        clientNameRange.push(client.client_name);
      }); // Pulling out the client name strings from the array of object results.
      let matchingNames = []; // An array to be used for any client names that match.
      // We now see if the string provided by the user is in any of the names in the database/clientNameRange array. For every case where it does, the target name is added to the new namesearch array.
      clientNameRange.forEach((fullName) => {
        if (fullName.toUpperCase().includes(name.toUpperCase())) {
          matchingNames.push(fullName);
        }
      });
      // Then we search for all clients whose names matched the search and return them joined with all contracts to which they are associated as well as the targets for those contracts.
      return knex('clients').fullOuterJoin('contracts', 'clients.id', 'contracts.client_id').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').whereIn('clients.client_name', matchingNames)
    })
    .then((contracts) => {
      // Finally, we take the array of those results and pass it to the multiple contracts view page for rendering.
      res.render('../views/contracts.ejs', {
        onMain : false,
        onAssassins : false,
        onContracts : true,
        search : true,
        contracts : contracts
      });
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  }
});

// For a GET request to the route /contracts that includes an id. - This will return the contract page with target, client, and assigned assassins.
router.get('/:id', (req, res) => {
  let idRange = [];
  let id = filterInt(req.params.id);
  console.log(`I see the ID. It's - ${id}`);
  if (!isNaN(id)) {
    let contractObj;
    let totalAssassinArr;
    knex.select('contract_set_id').from('contracts')
      .then((idArr) => {
        for (let i = 0; i < idArr.length; i++) {
          idRange.push(idArr[i].contract_set_id);
        }
        return;
      })
      .then(() => {
        if (idRange.includes(id)) {
          console.log('Made it to the first search');
          return knex('assassins').distinct('name').select('*').fullOuterJoin('code_names', 'assassins.id', 'code_names.assassin_id')
          .then((assassinTotal) => {
            totalAssassinArr = assassinTotal;
            return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').where('contracts.contract_set_id',id);
          })
          .then((result) => {
            console.log(result);
            contractObj = result[0];
            contractObj.totalAssassins = totalAssassinArr;
            return knex.select('assassin_id').from('assassins_contracts').where('contract_id', contractObj.contract_set_id);
          })
          .then((assassinResults) => {
            console.log(`Made it to the second search.`);
            let assassinIDs = assassinResults.map((obj) => {
              return obj.assassin_id;
            });
            return knex.select('*').from('assassins').fullOuterJoin('code_names', 'assassins.id', 'code_names.assassin_id').whereIn('assassins.id', assassinIDs);
          })
          .then((assignedAssassins) => {
            contractObj.assassins = assignedAssassins;
            console.log("Make sure we have total assassins - ", contractObj.totalAssassins);
            res.render('../views/contract.ejs', {
              onMain : false,
              onAssassins : false,
              onContracts : true,
              assassins : false,
              contract : contractObj
            });
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
    console.log(`This isn't a number`)
    res.sendStatus(404);
  }
});

// For a POST request to /contracts/assign - This requires that there be an assassin_id and a contact_id in the body. It assigns a contract to an assassin. THIS IS COMPLETE.
router.post('/assign', (req, res) => {
  let assignmentObj = req.body;
  console.log("Post is happening - ", assignmentObj);
  if (assignmentObj.assassinToAssign && assignmentObj.contractAssigned) {
    knex('assassins_contracts').insert({
      "assassin_id" : assignmentObj.assassinToAssign,
      "contract_id" : assignmentObj.contractAssigned
    })
    .then(() => {
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
    'name' : bodyObj.client_name
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
      return knex.select('id').from('clients').where('name', bodyObj.client_name);
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
    return           knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').where('contracts.id', contract_id[0]);
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
  console.log(`Here's a delete request`, req.body);
  let assignmentObj = req.body;
  if (assignmentObj.assassinID && assignmentObj.contractID) {
    knex('assassins_contracts').where({
      'assassin_id' : assignmentObj.assassinID,
      'contract_id' : assignmentObj.contractID
    }).del()
    .then(() => {
      //This sends a 200 status if it works. Will need to update with more detail later.
      res.sendStatus(200);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else if (assignmentObj.assassinID) {
    knex('assassins_contracts').where({
      'assassin_id' : assignmentObj.assassinID
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
    knex.select('contract_set_id').from('contracts')
      .then((idArr) => {
        idArr.forEach((idObj) => {
          idRange.push(idObj.contract_set_id);
        })
        if (idRange.includes(id)) {
          knex('assassins_contracts').where('contract_id', id).del()
          .then(() => {
            return knex('contracts').where('contract_set_id', id).del();
          })
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
