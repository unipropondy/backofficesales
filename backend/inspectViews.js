const { sql, poolPromise } = require('./db');
(async () => {
  try {
    const pool = await poolPromise;
    const viewNames = [
      'dbo.vw_PaymentDetail',
      'dbo.vw_PaymentDetailCur',
      'dbo.vw_RestaurantOrderDetail',
      'dbo.vw_RestaurantOrderDetailCur',
      'dbo.vw_RestaurantOrder',
      'dbo.vw_RestaurantOrderCur'
    ];
    for (const name of viewNames) {
      const r = await pool.request().query(`SELECT TOP 1 * FROM ${name}`);
      const cols = Object.keys(r.recordset.columns);
      console.log(name + ':', cols.length);
      console.log(cols.join(', '));
      console.log('---');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await sql.close();
  }
})();
