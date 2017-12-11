let fs = require('fs');
let csv;

exports.seed = (knex, Promise) => {
  // Deletes ALL existing entries
  return knex('code_names').del()
    .then(() => {
      return knex('weapons').del();
    })
    .then(() => {
      return knex('assassins').del();
    })
    .then(() => {
      return new Promise (
        (resolve, reject) => {
          fs.readFile('/Users/lancehunter/galvanize/unit-2/killbase-app/data/assassins.csv', 'utf8', (err, data) => {
            if (err) reject(err);
            let assassinArray = [];
            let rowsArray = data.split('\n');
            rowsArray.pop();
            csv = rowsArray;
            let checkArr = [];
            for (i=1; i<rowsArray.length; i++) {
              let assassinObject = {};
              let assassinValues = rowsArray[i].split(',');
              let checkString = assassinValues[0];
              console.log('The check string - '+ checkString);
              console.log('The check array - '+ checkArr);
              if (!checkArr.includes(checkString)) {
                assassinObject = {
                  "name" : assassinValues[0],
                  "contact_info" : assassinValues[3],
                  "age" : assassinValues[4],
                  "price" : assassinValues[5],
                  "rating" : assassinValues[6],
                  "kills" : assassinValues[7],
                }
                checkArr.push(checkString);
                assassinArray.push(assassinObject);
              }
            }
            resolve(assassinArray);
          });
        }
      );
    })
    .then((assassinArray) => {
      return knex('assassins').insert(assassinArray);
    })
    .then(() => {
      let codeNamesArr=[];
      for (i=1; i<csv.length; i++) {
        assassinValues = csv[i].split(',');
        let codeNameInputString = `INSERT INTO code_names (name, assassin_id) VALUES ('${assassinValues[1]}', (SELECT id FROM assassins WHERE name='${assassinValues[0]}'));`;
        codeNamesArr.push(codeNameInputString);
      }
      let codeNameInputString = codeNamesArr.join('\n');
      console.log(codeNameInputString);
      return knex.raw(codeNameInputString);
    })
    .then(() => {
      let weaponsArr=[];
      for (i=1; i<csv.length; i++) {
        assassinValues = csv[i].split(',');
        let weaponInput = `INSERT INTO weapons (name, assassin_id) VALUES ('${assassinValues[2]}', (SELECT id FROM assassins WHERE name='${assassinValues[0]}'));`;
        weaponsArr.push(weaponInput);
      }
      let weaponInputString = weaponsArr.join('\n');
      console.log(weaponInputString);
      return knex.raw(weaponInputString);
    })
};
