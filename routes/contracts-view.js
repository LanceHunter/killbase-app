'use strict';

//Setting up knex
const env = 'production';
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

// For a GET request to the main contracts route, /contracts - This will return a page showing all of the existing contracts. THIS IS COMPLETE.
router.get('/', (req, res) => {
  let totalAssassins = [];
  knex('assassins').distinct('name').select('*').fullOuterJoin('code_names', 'assassins.id', 'code_names.assassin_id')
  .then((assassinTotal) => {
    totalAssassins = assassinTotal;
    return knex.select('*').from('contracts').join('targets', 'contracts.target_id', 'targets.id').join('clients', 'contracts.client_id', 'clients.id') // Grabbing all contracts joined with their target and the client name.
  })
  .then((results) => {
    let finalResults = [];
    results.forEach((result) => {
      if (!result.completed) {
        result.totalAssassins = totalAssassins;
        finalResults.push(result);
      }
    });
    console.log(finalResults);
    res.render('../views/contracts.ejs', { // Then we send that to the multiple contracts page to get rendered.
      onMain : false,
      onAssassins : false,
      onContracts : true,
      search : false,
      total : false,
      contracts : finalResults
    });
  })
  .catch((err) => { // If there's a database error, we send a 500 error.
    console.error(err);
    res.sendStatus(500);
  });
});


// For a GET request to the main contracts route, /contracts/all - This will return a page showing all of the existing contracts.
router.get('/all', (req, res) => {
  let totalAssassins = [];
  knex('assassins').distinct('name').select('*').fullOuterJoin('code_names', 'assassins.id', 'code_names.assassin_id')
  .then((assassinTotal) => {
    totalAssassins = assassinTotal;
    return knex.select('*').from('contracts').join('targets', 'contracts.target_id', 'targets.id').join('clients', 'contracts.client_id', 'clients.id') // Grabbing all contracts joined with their target and the client name.
  })
  .then((results) => {
    results.forEach((result) => {
      result.totalAssassins = totalAssassins;
    });
    console.log(results);
    res.render('../views/contracts.ejs', { // Then we send that to the multiple contracts page to get rendered.
      onMain : false,
      onAssassins : false,
      onContracts : true,
      search : false,
      total : true,
      contracts : results
    });
  })
  .catch((err) => { // If there's a database error, we send a 500 error.
    console.error(err);
    res.sendStatus(500);
  });
});

// For a GET request to /contracts/add - This will bring up the add contract page. - THIS IS COMPLETE.
router.get('/add/', (req, res) => {
  knex('clients').select('client_name') // Getting all client names.
  .then((clients) => {
      let clientNames = clients.map((client) => { // Putting those client names into an array so it's just the names and not an object with the names as a value.
      return client.client_name;
    });
    res.render('../views/addcontract.ejs', { // Sending off to the add contract page to render.
      onMain : false,
      onAssassins : false,
      onContracts : true,
      search : false,
      clients : clientNames
    });
  });
});


// For a GET request to /contracts/search. We first check to see if the target name or the code name is being searched. Then, depending on the search type, the name string provided by the user is searched. THIS IS COMPLETE.
router.get('/search', (req, res) => {
  let queryType = req.query.typeSearch; // The string for the type of search performed.
  let totalAssassins = [];
  let name = req.query.nameSearch; // The string that the user wants searched.
  knex('assassins').distinct('name').select('*').fullOuterJoin('code_names', 'assassins.id', 'code_names.assassin_id')
  .then((assassinTotal) => {
    totalAssassins = assassinTotal;
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
        contracts.forEach((contract) => {
          contract.totalAssassins = totalAssassins;
        });
        // Now we send the array of results to the multiple contrats page for rendering.
        res.render('../views/contracts.ejs', {
          onMain : false,
          onAssassins : false,
          onContracts : true,
          search : true,
          total : false,
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
        contracts.forEach((contract) => {
          contract.totalAssassins = totalAssassins;
        });
        // Finally, we take the array of those results and pass it to the multiple contracts view page for rendering.
        res.render('../views/contracts.ejs', {
          onMain : false,
          onAssassins : false,
          onContracts : true,
          search : true,
          total : false,
          contracts : contracts
        });
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
    }
  });
});

// For a GET request to the route /contracts/edit/ that includes an id. - This will bring up the contract edit page, filled in with the infromation included in contract.
router.get('/edit/:id', (req, res) => {
  let idRange = [];
  let id = filterInt(req.params.id);
  if (!isNaN(id)) {
    let contractObj;
    let totalAssassinArr;
    knex.select('contract_set_id').from('contracts')
      .then((idArr) => {
        idArr.forEach((inResult) => {
          idRange.push(inResult.contract_set_id);
        });
        if (idRange.includes(id)) {
          knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').where('contracts.contract_set_id',id)
          .then((result) => {
            contractObj = result[0];
            return knex('clients').select('client_name');
          })
          .then((clients) => {
            console.log(clients);
            let clientNames = clients.map((client) => { // Putting those client names into an array so it's just the names and not an object with the names as a value.
              return client.client_name;
            });
            contractObj.clients = clientNames;
            console.log(clientNames);
            res.render('../views/editcontract.ejs', {
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

// For POST requests to /contracts/add - This will take the body of the request and first check to see if the client is in our client list. Then it creates a target, then if the client is not already in our list then it creates a new client. If the client is already in our list then it gets the id for that client. Finally, it create contract for that target and client and sends the JSON for the join table of contract+target.
router.post('/add/', (req, res) => {
  let bodyObj = req.body;
  let targetID;
  let clientID;
  let clientArr = [];
  let contractObj = {};
  let targetObj = {
    'name' : bodyObj.targetName,
    'location' : bodyObj.location,
    'photo_url' : bodyObj.photo_url,
    'security_level' : bodyObj.secLevel
  };
  let clientObj = {
    'client_name' : bodyObj.client
  }
  knex.select('client_name').table('clients')
  .then((results) => {
    console.log(results);
    results.forEach((client) => {
      clientArr.push(client.client_name);
    })
    return knex('targets').insert(targetObj).returning('id');
  })
  .then((target_id) => {
    targetID = target_id[0];
    if (clientArr.includes(bodyObj.client)) {
      console.log('Name not found.')
      return knex.select('id').from('clients').where('client_name', bodyObj.client);
    } else {
      console.log('Name found')
      return knex('clients').insert({name:bodyObj.client}).returning('id');
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
    return knex('contracts').insert(contractObj).returning('contract_set_id');
  })
  .then((contract_id) => {
    return           knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').where('contracts.contract_set_id', contract_id[0]);
  })
  .then((response) => {
    contractObj = response[0];
    return knex('assassins').distinct('name').select('*').fullOuterJoin('code_names', 'assassins.id', 'code_names.assassin_id');
  })
  .then((assassinTotal) => {
    contractObj.totalAssassins = assassinTotal;
    contractObj.assassins = [];
    res.render('../views/contract.ejs', {
      onMain : false,
      onAssassins : false,
      onContracts : true,
      assassins : false,
      contract : contractObj
    });
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});

// For a PATCH request to /contracts/complete followed by an ID number. This will take the contract and mark it as complete, mark the contract's target as dead, and add the assassin that completed the contract (taken from the request body) to the contract's "completed_by" column.

router.patch('/complete/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let completedObj = req.body;
  console.log('This is who completed the contract - ', completedObj.assassin_id);
  let idRange = [];
  if (!isNaN(id)) {
    knex.select('contract_set_id').from('contracts')
    .then((idArr) => {
      idRange = idArr.map((soloID) => {
        return soloID.contract_set_id;
      });
      if (idRange.includes(id)) {
        return knex('contracts').select('target_id').where('contract_set_id', id);
      } else {
        return res.sendStatus(404);
      }
    })
    .then((target_id) => {
      if (idRange.includes(id)) {
        console.log(`The contract's target ID - `, target_id[0].target_id)
        return knex('targets').where('id', target_id[0].target_id).update({
          alive : false
        });
      } else { // Returning blank if id isn't in range (we already sent the 404).
        return;
      }
    })
    .then(() => {
      if (idRange.includes(id)) {
        return knex('contracts').where('contract_set_id', id).update({
          completed : true,
          completed_by : completedObj.assassin_id
         });
      } else { // Returning blank if id isn't in range (we already sent the 404).
        return;
      }
    })
    .then(() => {
      res.send(completedObj)
    })
    .catch((err) => {
      console.error('Error completing contract info - ', err);
      res.sendStatus(500);
    })
  } else { // Returning 404 if they didn't put a number as the ID.
    res.sendStatus(404);
  }
});


// For PATCH requests to /contracts/edit/ followed by an ID number - This will udpate the contract infromation based on the information.
router.patch('/edit/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let contractObj = req.body;
  let idRange = [];
  if (!isNaN(id)) {
    knex.select('contract_set_id').from('contracts')
      .then((idArr) => {
        idRange = idArr.map((soloID) => {
          return soloID.contract_set_id;
        });
        if (idRange.includes(id)) {
          if (contractObj.budget) {
            return knex('contracts').where('contract_set_id', id).update({
              'budget' : contractObj.budget
            });
          } else { // Returning if there is no budget change included.
            return;
          }
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          return knex('contracts').select('target_id').where('contract_set_id', id);
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then((targetIDArr) => {
        if (idRange.includes(id)) {
          contractObj.target_id = targetIDArr[0].target_id; //Saving the ID lookups.
          if (contractObj.targetName) {
            return knex('targets').where('id', contractObj.target_id).update({
              'name' : contractObj.targetName
            });
          } else { // Returning blank if no name was provided.
            return;
          }
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          if (contractObj.secLevel) {
            return knex('targets').where('id', contractObj.target_id).update({
              'security_level' : contractObj.secLevel
            });
          } else { // Returning blank if no security level was provided.
            return;
          }
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          if (contractObj.location) {
            return knex('targets').where('id', contractObj.target_id).update({
              'location' : contractObj.location
            });
          } else { // Returning blank if no security level was provided.
            return;
          }
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          if (contractObj.photo_url) {
            return knex('targets').where('id', contractObj.target_id).update({
              'photo_url' : contractObj.photo_url
            });
          } else { // Returning blank if no photo url was provided.
            return;
          }
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then(() => {
        if (idRange.includes(id)) {
          if (contractObj.client_name) {
            return knex('clients').select('id').where('client_name', contractObj.client_name);
          } else { // Returning blank if no client name was provided.
            return;
          }
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then((clientID) => {
        if (idRange.includes(id)) {
          if (contractObj.client_name) {
            contractObj.client_id = clientID[0].id;
            return knex('contracts').where('contract_set_id', id).update({
              'client_id' : contractObj.client_id
            });
          } else { // Returning blank if no client name was provided.
            return;
          }
        } else { // Returning blank if ID isn't in the contract range.
          return;
        }
      })
      .then(() => {
        res.send(contractObj);
      })
      .catch((err) => {
        console.error(err);
        res.sendStatus(500);
      });
  } else {
    console.log(`We don't think the request is a number.`)
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
  let targetID;
  if (!isNaN(id)) {
    knex.select('contract_set_id').from('contracts')
      .then((idArr) => {
        idArr.forEach((idObj) => {
          idRange.push(idObj.contract_set_id);
        })
        if (idRange.includes(id)) {
          knex('assassins_contracts').where('contract_id', id).del()
          .then(() => {
            return knex('contracts').select('target_id').where('contract_set_id', id);
          })
          .then((targetIDObj) => {
            targetID = targetIDObj[0].target_id
            return knex('contracts').where('contract_set_id', id).del();
          })
          .then(() => {
            return knex('targets').where('id', targetID).del();
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
