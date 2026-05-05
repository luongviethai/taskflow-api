import type { Knex } from 'knex';
import { config } from '../config/env';

const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  },
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
};

export default knexConfig;