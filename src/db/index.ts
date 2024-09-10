import { createConnection } from "mysql2";

function initDB() {
  const conection = createConnection({
    user: "root",
    password: "root",
  });

  conection.connect();

  conection.query(CREATE_DB);
  conection.query(SELECT_DB);
  conection.query(CREATE_USER_TABLE);

  return conection;
}

const CREATE_DB = "CREATE DATABASE IF NOT EXISTS trab";

const SELECT_DB = "USE trab";

const CREATE_USER_TABLE = `
    CREATE TABLE IF NOT EXISTS User(
        id int not null auto_increment,
        username varchar(100) not null,
        password char(64) not null,
        CONSTRAINT PK_User PRIMARY KEY (id)
    );
`;

export default initDB;
