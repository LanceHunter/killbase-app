
exports.up = function(knex, Promise) {
  return knex.schema.table('contracts', (table) => {
    table.renameColumn('id', 'contract_set_id');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('contracts', (table) => {
    table.renameColumn('contract_set_id', 'id');
  });
};
