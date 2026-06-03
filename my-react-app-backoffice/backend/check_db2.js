const {poolPromise} = require('./db.js');
poolPromise.then(pool => {
  return pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'DishGroupMaster'");
}).then(r => {
  console.dir(r.recordset);
}).catch(console.error).finally(()=>process.exit(0));
