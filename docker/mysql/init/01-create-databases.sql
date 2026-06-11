CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS user_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS class_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS subject_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS grade_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS schedule_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'auth_user'@'%' IDENTIFIED BY 'auth_password';
CREATE USER IF NOT EXISTS 'user_user'@'%' IDENTIFIED BY 'user_password';
CREATE USER IF NOT EXISTS 'class_user'@'%' IDENTIFIED BY 'class_password';
CREATE USER IF NOT EXISTS 'subject_user'@'%' IDENTIFIED BY 'subject_password';
CREATE USER IF NOT EXISTS 'grade_user'@'%' IDENTIFIED BY 'grade_password';
CREATE USER IF NOT EXISTS 'schedule_user'@'%' IDENTIFIED BY 'schedule_password';

GRANT ALL PRIVILEGES ON auth_db.* TO 'auth_user'@'%';
GRANT ALL PRIVILEGES ON user_db.* TO 'user_user'@'%';
GRANT ALL PRIVILEGES ON class_db.* TO 'class_user'@'%';
GRANT ALL PRIVILEGES ON subject_db.* TO 'subject_user'@'%';
GRANT ALL PRIVILEGES ON grade_db.* TO 'grade_user'@'%';
GRANT ALL PRIVILEGES ON schedule_db.* TO 'schedule_user'@'%';

FLUSH PRIVILEGES;
