const GenerateUsers = require("../../../utils/GenerateUsers");

exports.seed = async function (knex) {
  await knex('tags').del();
  await knex('links').del();
  await knex('notes').del();
  await knex('users').del();

  const rows = 5000;

  const list = new GenerateUsers("any", rows);
  const chunkSize = 400;
  const dataList = list.generateNames();

  await knex.transaction(function (tr) {
    return knex.batchInsert('users', dataList, chunkSize).transacting(tr);
  });

  await knex.raw('DELETE FROM users WHERE id in (SELECT id FROM users GROUP BY name, email HAVING COUNT(*) > 1)');

  console.log(`Seeding ${'users'} table completed!🔥`);
};
