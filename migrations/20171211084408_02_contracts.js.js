
exports.up = function(knex, Promise) {
  return knex.schema.table('contracts', (table) => {
    table.integer('client_id').references('clients.id').notNullable();
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('contracts', (table) => {
    table.dropColumn('client_id');
  });
};
