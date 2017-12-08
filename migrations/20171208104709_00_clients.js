
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('clients', (table) => {
    table.increments();
    table.string('name').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('clients');
};
