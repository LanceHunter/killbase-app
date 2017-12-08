
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('contracts', (table) => {
    table.increments();
    table.integer('target_id').references('targets.id').notNullable();
    table.integer('assassin_id').references('assassins.id').notNullable();
    table.integer('budget').notNullable();
    table.boolean('completed').notNullable().defaultTo(false);
    table.integer('completed_by').references('assassins.id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('contracts');
};
