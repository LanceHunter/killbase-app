
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('code_names', (table) => {
    table.increments();
    table.string('name').notNullable().defaultTo('unknown');
    table.integer('assassin_id').references('assassins.id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('code_names');
};
