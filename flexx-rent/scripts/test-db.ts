import fs from 'fs';
import path from 'path';

// Функция ручной загрузки переменных из .env (работает и в CJS, и в ESM)
function loadEnv() {
  if (process.env.DB_HOST) return;

  // 1. Проверяем корень, где открыт терминал (process.cwd())
  let envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) envPath = path.join(process.cwd(), '.env');
  
  // 2. Если там нет, ищем относительно папки самого скрипта (поднимаемся на уровень выше из scripts)
  if (!fs.existsSync(envPath)) {
    const currentDir = __dirname; // если компилируется в CJS
    envPath = path.resolve(currentDir, '../.env.local');
    if (!fs.existsSync(envPath)) {
      envPath = path.resolve(currentDir, '../.env');
    }
  }

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const firstEquals = trimmed.indexOf('=');
        if (firstEquals !== -1) {
          const key = trimmed.slice(0, firstEquals).trim();
          let val = trimmed.slice(firstEquals + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          process.env[key] = val;
        }
      }
    });
    console.log(`ℹ️ Настройки успешно загружены из: ${envPath}`);
  } else {
    console.warn(`⚠️ Не удалось найти .env или .env.local ни в ${process.cwd()}, ни в папке выше скрипта.`);
  }
}

// Загружаем переменные до импорта базы данных
loadEnv();

// Основная функция-обертка
async function run() {
  console.log('Attempting to connect to database with configurations:');
  console.log(`- Host: ${process.env.DB_HOST}`);
  console.log(`- User: ${process.env.DB_USER}`);
  console.log(`- Database: ${process.env.DB_NAME}`);
  console.log(`- Port: ${process.env.DB_PORT || 3306}`);

  // Подключаем модуль базы динамически
  const { databaseComnnect } = await import('../lib/db');

  databaseComnnect.getConnection((err, connection) => {
    if (err) {
      console.error('\n❌ Database connection failed!');
      console.error('Error Code:', err.code);
      console.error('Error Number:', err.errno);
      console.error('Message:', err.message);
      process.exit(1);
    }

    console.log('\n✅ Database connection successful!');
    
    connection.query('SELECT 1 + 1 AS result', (queryErr, results) => {
      connection.release(); // возвращаем коннект в пул

      if (queryErr) {
        console.error('❌ Test query failed:', queryErr.message);
        process.exit(1);
      }

      console.log('✅ Test query executed successfully!');
      console.log('Result:', results);
      process.exit(0);
    });
  });
}

run().catch(err => {
  console.error('Failed to run test:', err);
  process.exit(1);
});