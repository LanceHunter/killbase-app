
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('targets', (table) => {
    table.increments();
    table.string('name').notNullable();
    table.string('location').notNullable();
    table.string('photo_url');
    table.integer('security_level');
    table.boolean('alive').notNullable().defaultTo(true);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('targets');
};
