
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('code_names', (table) => {
    table.string('code_name').notNullable().defaultTo('unknown');
    table.integer('assassin_id').references('assassins.id').onDelete('CASCADE');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('code_names');
};
