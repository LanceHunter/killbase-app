
exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('assassins', (table) => {
    table.increments();
    table.string('name').notNullable().defaultTo('Unknown');
    table.string('contact_info').notNullable();
    table.integer('age');
    table.integer('price');
    table.integer('kills');
    table.decimal('rating',2,1);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('assassins');
};
