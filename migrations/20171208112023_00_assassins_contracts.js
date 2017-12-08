
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('assassins_contracts', (table) => {
    table.integer('contract_id').references('contracts.id').notNullable();
    table.integer('assassin_id').references('assassins.id').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('assassins_contracts');
};
