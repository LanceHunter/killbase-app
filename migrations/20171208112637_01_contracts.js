
exports.up = function(knex, Promise) {
  return knex.schema.table('contracts', (table) => {
    table.dropColumn('assassin_id');
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.table('contracts', (table) => {
    table.integer('assassin_id').references('assassins.id');
  })
};
