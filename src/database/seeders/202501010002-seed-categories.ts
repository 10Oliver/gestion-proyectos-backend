import { QueryInterface } from 'sequelize';

const categories = ['Deportes', 'Artes y creatividad', 'Naturaleza', 'Festival'];

module.exports = {
  async up(queryInterface: QueryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'categories',
      categories.map((name) => ({ name, created_at: now, updated_at: now })),
      {},
    );
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('categories', { name: categories });
  },
};
