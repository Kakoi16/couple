PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
);
INSERT INTO users VALUES(1,'Yulia','yulia@gmail.com','$2b$10$OxAIOxrxqaYDqoz.4RxVIOG6oj6KAV98ge6cJWdFx8Ax9E1qOY4ra');
INSERT INTO users VALUES(2,'Kakoi','ikhsann330@gmail.com','$2b$10$3IaWeeFazV2oKmSl5aoHBOhA/WWBdkAPjuvrljjBvaBNh3tF/YwhG');
CREATE TABLE IF NOT EXISTS "messages" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
, deleted_for_user TEXT DEFAULT NULL, deletedFor TEXT);
INSERT INTO messages VALUES(1,'user1','user2','Halo, apa kabar?','2025-03-15 06:13:56',NULL,NULL);
INSERT INTO messages VALUES(12,'Yulia','Kakoi','a','2025-03-15 07:01:10',NULL,'Yulia,Kakoi');
INSERT INTO messages VALUES(14,'Kakoi','Yulia','a','2025-03-15 07:10:13',NULL,NULL);
INSERT INTO messages VALUES(16,'Yulia','Yulia','aa','2025-03-15 07:12:31',NULL,NULL);
INSERT INTO messages VALUES(17,'Yulia','Yulia','a','2025-03-15 07:12:35',NULL,NULL);
INSERT INTO messages VALUES(19,'Yulia','Kakoi','yyyy','2025-03-15 07:13:07',NULL,NULL);
INSERT INTO messages VALUES(20,'Yulia','Kakoi','aa','2025-03-15 10:20:22',NULL,NULL);
INSERT INTO messages VALUES(21,'Kakoi','Yulia','a','2025-03-15 10:22:36',NULL,'["Yulia"]');
INSERT INTO messages VALUES(22,'Yulia','Kakoi','aa','2025-03-15 10:22:42',NULL,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',2);
INSERT INTO sqlite_sequence VALUES('messages',22);
COMMIT;
