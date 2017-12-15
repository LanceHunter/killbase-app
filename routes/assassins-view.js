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

// Getting all assassins bringing them up on the assassins page.
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

// For a GET request to /assassins/search. The string provided in the request body will be searched.
router.get('/search', (req, res) => {
  let queryType = req.query.typeSearch;
  let name = req.query.nameSearch;
  let assassinObj = {};
  if (queryType === `Search by Name`) {
    console.log("This is the Type - " + queryType);
    let namesRange = [];
    knex.select('name').from('assassins')
    .then((nameArr) => {
      console.log(nameArr);
      for (let i=0; i<nameArr.length; i++) {
        namesRange.push(nameArr[i].name);
      }
    })
    .then(() => {
      if (namesRange.includes(name)) {
        knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id').where('assassins.name', name)
        .then((result) => {
            assassinObj = result[0];
            return knex.select('code_name').from('code_names').where('assassin_id', assassinObj.id);
          })
          .then((codeNames) => {
            assassinObj.codeNameArr = codeNames;
            return knex('assassins_contracts').select('contract_id').where('assassin_id', assassinObj.id);
          })
          .then((contract_ids) => {
            let contractIDs = contract_ids.map((obj) => {
              return obj.contract_id;
            });
            return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('contracts.id', contractIDs)
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
          return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('contracts.id', contractIDs)
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

// For a GET call on /assassins that then includes an ID number. This will bring up an individual assassin's page, including the contracts to which they are assigned.
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
            return knex.select('*').from('contracts').fullOuterJoin('targets', 'contracts.target_id', 'targets.id').fullOuterJoin('clients', 'contracts.client_id', 'clients.id').whereIn('contracts.id', contractIDs)
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