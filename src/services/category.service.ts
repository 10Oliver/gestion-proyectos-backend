import { Category } from '../database/models/category.model';

export const listCategories = () => Category.findAll({ order: [['name', 'ASC']] });

export const createCategory = async (name: string) => {
  const [category, created] = await Category.findOrCreate({ where: { name } });
  if (!created) {
    throw Object.assign(new Error('Category already exists'), { status: 409 });
  }
  return category;
};
