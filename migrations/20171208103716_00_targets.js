
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('targets', (table) => {
    table.increments();
    table.string('name').notNullable();
    table.string('location').notNullable();
    table.integer('photo_url');
    table.integer('security_level');
    table.boolean('alive').notNullable().defaultTo(true);
  });
};

exports.down = function(knex, Promise) {
  knex.schema.dropTableIfExists('targets');
};
