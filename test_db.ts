import Database from 'better-sqlite3';
try {
  const db = new Database(':memory:');
  console.log('Better-sqlite3 is working!');
} catch (e) {
  console.error('Better-sqlite3 failed:', e);
}
