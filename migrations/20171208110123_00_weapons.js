
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('weapons', (table) => {
    table.increments();
    table.string('name').notNullable().defaultTo('unknown');
    table.integer('assassin_id').references('assassins.id').notNullable();
  });
};

exports.down = function(knex, Promise) {
  knex.schema.dropTableIfExists('weapons');
};
