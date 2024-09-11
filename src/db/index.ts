import { createConnection } from "mysql2/promise";

async function initDB() {
  const conection = await createConnection({
    user: "root",
    password: "root",
  });

  await conection.connect();

  await conection.query(CREATE_DB);
  await conection.query(SELECT_DB);
  await conection.query(CREATE_USER_TABLE);

  return conection;
}

const CREATE_DB = "CREATE DATABASE IF NOT EXISTS trab";

const SELECT_DB = "USE trab";

const CREATE_USER_TABLE = `
    CREATE TABLE IF NOT EXISTS User(
        id int not null auto_increment,
        username varchar(100) not null unique,
        password char(64) not null,
        CONSTRAINT PK_User PRIMARY KEY (id)
    );
`;

export default initDB;
