
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('weapons', (table) => {
    table.increments();
    table.string('weapon_name').notNullable().defaultTo('unknown');
    table.integer('assassin_id').references('assassins.id').notNullable().onDelete('CASCADE');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('weapons');
};
