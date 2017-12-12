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

// This is for GET calls on the main route, /assassins - This returns all assassins.
router.get('/', (req, res) => {
  let resultArr = [];
  knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id')
  .then((result) => {
      resultArr = result;
      res.send(resultArr);
    })
    .catch((err) => {
      console.error(err);
      res.sendStatus(500);
    });
});

// For a GET call on /assassins/total - This returns an object with key "count" whose value is equal to the total number of assassins.
router.get('/total', (req, res) => {
  knex('assassins').countDistinct('id')
  .then ((result) => {
    res.send(result[0]);
  })
  .catch((err) => {
    console.error(err);
    res.sendStatus(500);
  })
});

// For a GET call on /assassins that then includes an ID number. This will return JSON containing information for whichever assassin's id was entered. It will return a 404 if a number is not passed or if the number is out of the range of the current assasin IDs.
router.get('/:id', (req, res) => {
  let id = filterInt(req.params.id);
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
        knex.select('*').from('assassins').fullOuterJoin('weapons', 'assassins.id', 'weapons.assassin_id').where('assassins.id', id)
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
  } else {
    res.sendStatus(404);
  }
});

// For a GET request to /assassins/names/ that is followed by a string. The string will be searched and if it matches an assassin's name it will return JSON with that assassins information. Otherwise, a 404 is sent.
router.get('/names/:id', (req, res) => {
  let name = req.params.id;
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
      knex.select('*').from('assassins').where('name', name)
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

// For GET requets to /assassins/codenames/all - This requires an id number be passed in that matches the id of an existing assassin, otherwise a 404 is returned. If a valid id is passed in, then an array of all code names for the assassin is returned.
router.get('/codenames/all/:id', (req, res) => {
  let id = filterInt(req.params.id);
  let idArr = [];
  let nameArr = [];
  if (!isNaN(id)) {
    knex.select('id').from('assassins')
    .then((resultArr) => {
      for (let i=0; i<resultArr.length; i++) {
        idArr.push(resultArr[i].id);
      }
    })
    .then(() => {
      if (idArr.includes(id)) {
        return knex.select('code_name').from('code_names').where('assassin_id', id);
      } else {
        console.log('Not in the array');
        res.sendStatus(404);
      }
    })
    .then((codeNameArr) => {
      for (let i=0; i<codeNameArr.length; i++) {
        nameArr.push(codeNameArr[i].code_name);
      }
      res.send(nameArr);
    })

  } else {
    console.log('Not a number for ID');
    res.sendStatus(404);
  }
});


// For a GET request to /assassins/codenames/ that is followed by a string. The string will be searched and if it matches an assassin's code name it will return JSON with that assassins information. Otherwise, a 404 is sent.
router.get('/codenames/:id', (req, res) => {
  let codeName = req.params.id;
  console.log(codeName);
  let codeNamesRange = [];
  knex.select('code_name').from('code_names')
  .then((codeNameArr) => {
    console.log(codeNameArr);
    for (let i=0; i<codeNameArr.length; i++) {
      codeNamesRange.push(codeNameArr[i].code_name);
    }
  })
  .then(() => {
    if (codeNamesRange.includes(codeName)) {
      knex.select('*').from('code_names').fullOuterJoin('assassins', 'code_names.assassin_id', 'assassins.id').where('code_names.code_name', codeName)
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
