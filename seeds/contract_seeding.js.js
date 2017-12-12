let fs = require('fs');
let csv;

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('contracts').del()
    .then(() => {
      return knex('clients').del();
    })
    .then(() => {
      return knex('targets').del();
    })
    .then(() => {
      return new Promise (
        (resolve, reject) => {
          fs.readFile('/Users/lancehunter/galvanize/unit-2/killbase-app/data/contracts.csv', 'utf8', (err, data) => {
            if (err) reject(err);
            let targetArray = [];
            let rowsArray = data.split('\n');
            rowsArray.pop();
            csv = rowsArray;
            for (i=1; i<rowsArray.length; i++) {
              let targetObj = {};
              let targetValues = rowsArray[i].split(',');
              targetValues[0] = targetValues[0].trim().slice(1,(targetValues[0].length-1));
              targetValues[1] = targetValues[1].trim().slice(1,(targetValues[1].length-2));
              targetValues[2] = targetValues[2].trim().slice(1,(targetValues[2].length-2));
              targetObj = {
                "name" : targetValues[0],
                "location" : targetValues[1],
                "photo_url" : targetValues[2],
                "security_level" : targetValues[3]
              }
              targetArray.push(targetObj);
            }
          resolve(targetArray);
          });
      });
    })
    .then((targetsArray) => {
      return knex('targets').insert(targetsArray);
    })
    .then(() => {
      let clientArr = [];
      for (i=1; i<csv.length; i++) {
        let clientObj = {};
        let clientValues = csv[i].split(',');
        clientValues[4] = clientValues[4].trim().slice(1,(clientValues[4].length-2));
        clientObj = {
          "name" : clientValues[4]
        }
        clientArr.push(clientObj);
      }
      return knex('clients').insert(clientArr);
    })
    .then(() => {
      let keyObj = {};
      let targetID;
      let clientID;
      for (i=1; i<csv.length; i++) {
        let contractValues = csv[i].split(',');
        contractValues[0] = contractValues[0].trim().slice(1,(contractValues[0].length-1));        contractValues[4] = contractValues[4].trim().slice(1,(contractValues[4].length-2));
          knex('targets').returning('id').where('name',contractValues[0])
          .then((target_id) => {
            knex('clients').returning('id').where('name', contractValues[4])
            .then((client_id) => {
              console.log('Client id - ' + client_id[0].id);
              console.log('Target ID - ' + target_id[0].id);
              console.log('contractValues[5] - ' + contractValues[5]);
              keyObj = {
                'client_id':client_id[0].id,
                'target_id':target_id[0].id,
                'budget':contractValues[5]
                };
              let contractArr = [];
              contractArr.push(keyObj);
              return knex('contracts').insert(contractArr);
            })
          })
      }

    });
};
