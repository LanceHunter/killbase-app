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

// For a GET request to /assassins/ - This gets all assassins from the database, gets the associated weapons for the assasins, and renders it to the assassins multi-view page (assassins.ejs). This passes the array of returned assassins to the page for rendering.
router.get('/', (req, res) => {
  console.log(req.body);
  let codeNameArr = [];
  knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id')
  .then((assassinArr) => {
    res.render('../views/assassins.ejs', {
      onMain : false,
      onAssassins : true,
      onContracts : false,
      totalAssassins : true,
      assassins : assassinArr
    });
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});

// For a GET request to /assassins/search. This checks the body of the request for two things, the query type ("typeSearch" in the request body, becoming the variable "queryType") and the name being searched ("nameSearch" in the request body, becoming the variable "name"). If then performs a search for either the name or the codename of the assassin, using whatever string was entered in the name. All assassins that match have their information passed back and rendered to the multiple assasin page (assassins.ejs).
router.get('/search', (req, res) => {
  let queryType = req.query.typeSearch;
  let name = req.query.nameSearch;
  let assassinObj = {};
// Checking to see if the query type is for the "Name". If so, the logic below is performed for searching the assassin's name.
  if (queryType === `Name`) {
    let namesRange = []; // This will hold all of the assassin names.
    knex.select('*').from('assassins')
    .then((assassinArr) => {
      assassinArr.forEach((assassinName) => {
        namesRange.push(assassinName.name);
      }) // This grabs all assassin names from the db and puts them into the namesRange array, stripping them out of the object where they are contaied.
      let matchingNames = [];
      // We now see if the name provided by the user matches any of the names in the database. For every case where it does, the assasin name is added to the new namesearch array.
      namesRange.forEach((fullName) => {
        if (fullName.toUpperCase().includes(name.toUpperCase())) {
          matchingNames.push(fullName);
        }
      })
      // Then we search for a join table of the assassin + weapon for all the assassins whose names are in the array.
      knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id').whereIn('assassins.name', matchingNames)
      .then((result) => {
          res.render('../views/assassins.ejs', {
            onMain : false,
            onAssassins : true,
            onContracts : false,
            totalAssassins : false,
            assassins : result
          });
        }); // Finally, this is sent to the assassins.ejs page for rendering.
    })
    .catch((err) => {
      console.error(err); // Of course, if there's a database error, we catch and log it.
      res.sendStatus(500);
    });
  } else {
    //This is basically the same as above, but searching by Code Name instead of Name.
    let codeNamesRange = [];
    knex.select('*').from('code_names')
    .then((codeNameArr) => {
      codeNameArr.forEach((codeName) => {
        codeNamesRange.push(codeName);
      }); // This grabs all code name entries from the db and puts them into the codeNamesRange array.
      let matchingNames = [];
      let usedAssassinIDs = [];
      // We now see if the name provided by the user matches any of the code names in the database. For every case where it does, the code name is added to the new namesearch array. (Except when the assassinID is the same as a previously-added code name. This prevents duplicate assassin listings.)
      codeNamesRange.forEach((codeName) => {
        if (((name.toUpperCase() === codeName.code_name.toUpperCase()) || (codeName.code_name.toUpperCase().includes(name.toUpperCase()))) && (!usedAssassinIDs.includes(codeName.assassin_id))) {
          matchingNames.push(codeName.code_name);
          usedAssassinIDs.push(codeName.assassin_id);
        }
      })
      // Then we get a join table of assassins, code names, and weapons for any assassins whose code name matched.
      return knex.select('*').from('code_names').fullOuterJoin('assassins', 'code_names.assassin_id', 'assassins.id').fullOuterJoin('weapons', 'code_names.assassin_id', 'weapons.assassin_id').whereIn('code_names.code_name', matchingNames);
    })
    .then((results) => {
      // Finally all that gets rendered on the multiple assassins page.
      res.render('../views/assassins.ejs', {
        onMain : false,
        onAssassins : true,
        onContracts : false,
        totalAssassins : false,
        assassins : results
      });
    })
    .catch((err) => { // Once again, if there's a database error, we catch and log it.
      console.error(err);
      res.sendStatus(500);
    });
  }
});

// For a GET call on /assassins that then includes an ID number. This brings up the indvidual assassin's page, rendering that assassin's infromation, including any contracts to which they may be assigned, to the individual assassin page (assassin.ejs).
router.get('/:id', (req, res) => {
  let id = filterInt(req.params.id); // Confirming the ID provided is number.
  let idRange = [];
  let assassinObj = {}; // This will allow us to get all the information in a single object that is scoped in the full route.
  if (!isNaN(id)) { // If the id provided is a number, continue on to the actual logic.
    knex.select('id').from('assassins') // Grabbing all the IDs for our assassins.
    .then((idArr) => {
      // Now we take the array of returned id objects and pull the IDs out and into our variable showing which ids are in the right range.
      idArr.forEach((idObj) => {
          idRange.push(idObj.id);
      })
      if (idRange.includes(id)) { // Now we check to see if the provided ID is in the range of current assassin ids.
        return knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id').where('assassins.id', id) // Getting the join table of the assassin in question.
        .then((result) => {
            assassinObj = result[0]; // Pulling the result out of the array and putting it into the higher-scoped assassinObj variable.
            return knex.select('code_name').from('code_names').where('assassin_id', id); // Then looking for all code names that match the assassin.
          })
          .then((codeNames) => {
            assassinObj.codeNameArr = codeNames; // Then we put that code name results array into assassinObj.
            return knex('assassins_contracts').select('contract_id').where('assassin_id', assassinObj.id); // Then we search for the contracts to which the assassin is assigned.
          })
          .then((contract_ids) => {
            let contractIDs = contract_ids.map((obj) => {
              return obj.contract_id;
            }); // We strip the contract ID out of the resulting object.
            return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('contracts.contract_set_id', contractIDs); // Then we get a join table of the contract, target, and client information for all contracts in the array of resulting contracts.
          })
          .then((fullContracts) => {
            assassinObj.contracts = fullContracts; // Then we put that array of joined results into our assassinObj...
            res.render('../views/assassin.ejs', { // ...and send it to the assassin.ejs page to get rendered.
              onMain : false,
              onAssassins : true,
              onContracts : false,
              assassins : false,
              assassinObj : assassinObj
            });
          });
      } else { // If the ID provided is a number but isn't in range, we send a 404.
        res.sendStatus(404);
      }
    })
    .catch((err) => { // If there's any database error, give a 404 error.
      console.error(err);
      res.sendStatus(500);
    });
  } else { // If the id provided wasn't a number, give a 404 error.
    res.sendStatus(404);
  }
});


// For a POST request to /assassins/ - This will post a new assassin with the information provided in the body of the request.
router.post('/', (req, res) => {
  let assassinObj = req.body;
  console.log(assassinObj);
  knex('assassins').insert({
    'name' : assassinObj.name,
    'contact_info' : assassinObj.contact_info,
    'age' : assassinObj.age,
    'price' : assassinObj.price,
    'kills' : assassinObj.kills,
    'rating' : assassinObj.rating
  })
  .then((result) => {
    if (assassinObj.weapon) {
      knex.select('id').from('assassins').where('name',assassinObj.name)
      .then((returning) => {
        return knex('weapons').insert({'weapon_name':assassinObj.weapon, "assassin_id":returning[0].id});
      });
    }
    res.send(assassinObj);
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});

// For a POST request to /assassins/codenames - This will post a new code name for an assassin with the information provided in the body of the request. This will require two fields in the body: code_name and assassin_id (which must match the id of an existing assassin).
router.post('/codenames', (req, res) => {
  let codenameObj = req.body;
  console.log(codenameObj);
  if (codenameObj.code_name && codenameObj.assassin_id) {
    knex('code_names').insert({
      'code_name' : codenameObj.code_name,
      'assassin_id' : codenameObj.assassin_id
    })
    .then(() => {
      return knex.select('*').from('code_names').fullOuterJoin('assassins', 'code_names.assassin_id', 'assassins.id').where('code_names.code_name', codenameObj.code_name);
    })
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else {
    res.send(400);
  }
});


// For PATCH requests to /assassins/ followed by a numberic id and a json body. - This will require an id number matching the id of an existing assassin. If the id is not a number or does not match an existing assassin, a 404 is returned. Otherwise, the information in the body is changed for the assassin whose id was entered.
router.patch('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let assassinObj = req.body;
  console.log(assassinObj);
  let idRange = [];
  if (!isNaN(id)) {
    knex.select('id').from('assassins')
    .then((idArr) => {
      for (let i=0; i<idArr.length; i++) {
        idRange.push(idArr[i].id);
      }
    })
    .then(() => {
      if (idRange.includes(id)) {
        if (assassinObj.name) {
          console.log('Name found');
          knex('assassins').where('id',id).update({
            'name' : assassinObj.name
          }).returning('name')
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
        }
        if (assassinObj.contact_info) {
          console.log('Contact info found');
          knex('assassins').where('id',id).update({
            'contact_info' : assassinObj.contact_info
          }).returning('contact_info')
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
        }
        if (assassinObj.age) {
          console.log('Age found');
          knex('assassins').where('id',id).update({
            'age' : assassinObj.age
          }).returning('age')
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
        }
        if (assassinObj.price) {
          console.log('Price found');
          knex('assassins').where('id',id).update({
            'price' : assassinObj.price
          }).returning('price')
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
        }
        if (assassinObj.kills) {
          console.log('Kills found');
          knex('assassins').where('id',id).update({
            'kills' : assassinObj.kills
          }).returning('kills')
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
        }
        if (assassinObj.rating) {
          console.log('Rating found');
          knex('assassins').where('id',id).update({
            'rating' : assassinObj.rating
          }).returning('rating')
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
        }
        if (assassinObj.weapon) {
          console.log('Weapons found');
          knex('weapons').where('assassin_id', id).update({
            'weapon_name' : assassinObj.weapon
          }).returning('weapon')
          .catch((err) => {
            console.error(err);
            res.sendStatus(500);
          });
        }
      } else {
        res.sendStatus(404);
      }
    })
    .then(() => {
      res.send(assassinObj);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } else {
    res.sendStatus(404);
  }
});

// For DELETE requests to /assassins - This requires an id to be provided that is an integer matching the id of an existing assassin. If the id doesn't meet that criteria a 404 is returned. If it does, the assassin whose id matches the one provided is deleted from the database. All of their assignments, code names, and preferred weapons are deleted as well.
router.delete('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  if (!isNaN(id)) {
    knex('assassins_contracts').where('assassin_id',id).del()
    .then(() => {
    return knex('code_names').where('assassin_id',id).del()
    })
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
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
