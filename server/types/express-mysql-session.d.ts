declare module 'express-mysql-session' {
  import session from 'express-session';
  
  interface MySQLStoreOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    createDatabaseTable?: boolean;
    connectionLimit?: number;
    expiration?: number;
    clearExpired?: boolean;
    checkExpirationInterval?: number;
    schema?: {
      tableName?: string;
      columnNames?: {
        session_id?: string;
        expires?: string;
        data?: string;
      };
    };
  }

  interface MySQLStore {
    new (options: MySQLStoreOptions): session.Store;
  }

  function MySQLStoreFactory(session: typeof import('express-session')): MySQLStore;
  
  export = MySQLStoreFactory;
}
