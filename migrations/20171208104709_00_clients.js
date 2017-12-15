
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('clients', (table) => {
    table.increments();
    table.string('client_name').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('clients');
};
