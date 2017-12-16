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
  let resultArr = [];
  let codeNameArr = [];
  knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id')
  .then((result) => {
    resultArr = result;
    res.render('../views/assassins.ejs', {
      onMain : false,
      onAssassins : true,
      onContracts : false,
      totalAssassins : true,
      assassins : resultArr
    });
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });
});

// For a GET request to /assassins/search. This checks the body of the request for two things, the query type ("typeSearch" in the request body, becoming the variable "queryType") and the name being searched ("nameSearch" in the request body, becoming the variable "name"). If then performs a search for either the name or the codename of the assassin, using whatever string was entered in the name. If there is a matching assassin, their information is passed back and rendered to the individual assasin page (assassin.ejs).
router.get('/search', (req, res) => {
  let queryType = req.query.typeSearch;
  let name = req.query.nameSearch;
  let assassinObj = {};
// Checking to see if the query type is for the "Name". If so, the logic below is performed for searching the assassin's name.
  if (queryType === `Name`) {
    let namesRange = []; // This will hold all of the assassin names.
    knex.select('name').from('assassins')
    .then((nameArr) => {
      for (let i=0; i<nameArr.length; i++) {
        namesRange.push(nameArr[i].name);
      } // This grabs all assassin names from the db and puts them into the namesRange array
      return;
    })
    .then(() => {
      // We now see if the name provided by the user matches any in the database. If it does, we grab that assassin and the assassin's weapon from the database.
      if (namesRange.includes(name)) {
        knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id').where('assassins.name', name)
        .then((result) => {
            assassinObj = result[0]; // We put the matching assassin into the "assassinObj" variable, so that the information in't trapped in this scope.
            return knex.select('code_name').from('code_names').where('assassin_id', assassinObj.id); // We now grab any code names for the assassin.
          })
          .then((codeNames) => {
            assassinObj.codeNameArr = codeNames; // The code names are added to an array on the assassinObj.
            return knex('assassins_contracts').select('contract_id').where('assassin_id', assassinObj.id); //We now search for any contracts to which the assassin is assigned.
          })
          .then((contract_ids) => {
            let contractIDs = contract_ids.map((obj) => {
              return obj.contract_id;
            }); // This map takes the array of object with the key "contract_id" and then the actual contract ID we want and turns it into an array that just has the contract_id integers.
            return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('contracts.contract_set_id', contractIDs)
          }) // This is searching the database for all contracts that are in the array of contract IDs. (Specifically, a join table with the contract information, the target information, and the client name).
          .then((fullContracts) => {
            assassinObj.contracts = fullContracts; // This then pushes the array of returned contracts to the assassinObj. Finally, we render that infromation.
            res.render('../views/assassin.ejs', {
              onMain : false,
              onAssassins : true,
              onContracts : false,
              assassins : false,
              assassinObj : assassinObj
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
    //This is basically the same as above, but searching by Code Name instead of Name.
    let codeNamesRange = [];
    knex.select('code_name').from('code_names')
    .then((codeNameArr) => {
      console.log(codeNameArr);
      for (let i=0; i<codeNameArr.length; i++) {
        codeNamesRange.push(codeNameArr[i].code_name);
      }
    })
    .then(() => {
      if (codeNamesRange.includes(name)) {
        knex.select('*').from('code_names').fullOuterJoin('assassins', 'code_names.assassin_id', 'assassins.id').where('code_names.code_name', name)
        .then((result) => {
            assassinObj = result[0];
            assassinObj.codeNameArr = [];
            assassinObj.codeNameArr.push({
              'code_name' : assassinObj.code_name
            });
            console.log(assassinObj);
            return knex.select('weapon_name').from('weapons').where('weapons.assassin_id', assassinObj.id);
        })
        .then((weapons) => {
          assassinObj.weapon_name = weapons[0].weapon_name;
          return knex('assassins_contracts').select('contract_id').where('assassin_id', assassinObj.id);
        })
        .then((contract_ids) => {
          let contractIDs = contract_ids.map((obj) => {
            return obj.contract_id;
          });
          return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('contracts.contract_set_id', contractIDs)
        })
        .then((fullContracts) => {
          assassinObj.contracts = fullContracts;
          res.render('../views/assassin.ejs', {
            onMain : false,
            onAssassins : true,
            onContracts : false,
            assassins : false,
            assassinObj : assassinObj
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

  }
});

// For a GET call on /assassins that then includes an ID number. This brings up the indvidual assassin's page, rendering that assassin's infromation, including any contracts to which they may be assigned, to the individual assassin page (assassin.ejs).
router.get('/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let idRange = [];
  let assassinObj = {};
  if (!isNaN(id)) {
    knex.select('id').from('assassins')
    .then((idArr) => {
      for (let i=0; i<idArr.length; i++) {
        idRange.push(idArr[i].id);
      }
      return;
    })
    .then(() => {
      if (idRange.includes(id)) {
        knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id').where('assassins.id', id)
        .then((result) => {
            assassinObj = result[0];
            return knex.select('code_name').from('code_names').where('assassin_id', id);
          })
          .then((codeNames) => {
            assassinObj.codeNameArr = codeNames;
            return knex('assassins_contracts').select('contract_id').where('assassin_id', assassinObj.id);
          })
          .then((contract_ids) => {
            let contractIDs = contract_ids.map((obj) => {
              return obj.contract_id;
            });
            return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('contracts.contract_set_id', contractIDs)
          })
          .then((fullContracts) => {
            assassinObj.contracts = fullContracts;
            res.render('../views/assassin.ejs', {
              onMain : false,
              onAssassins : true,
              onContracts : false,
              assassins : false,
              assassinObj : assassinObj
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


// For DELETE requests to /assassins - This requires an id to be provided that is an integer matching the id of an existing assassin. If the id doesn't meet that criteria a 404 is returned. If it does, the assassin whose id matches the one provided is deleted from the database. All of their code names and preferred weapons are deleted as well.
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
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
