// Update with your config settings.

module.exports = {

  development: {
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'lancehunter',
      password : '',
      database : 'killbase'
    },
    migrations: {
      tableName: 'migrations'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'my_db',
      user:     'username',
      password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'pg',
    connection: {
      host: 'ec2-107-21-201-57.compute-1.amazonaws.com',
      port: 5432,
      database: 'd2137l4i22cb6t',
      user:     'gwqrwyzlpolflg',
      password: '148d63a59f2b149ff27ea28ad66b0aceb96f9bdf797c429862aa7f684186931e'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'migrations'
    }
  }

};
