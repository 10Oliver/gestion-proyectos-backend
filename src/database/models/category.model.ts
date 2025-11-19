import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Unique, HasMany } from 'sequelize-typescript';

import { Event } from './event.model';

@Table({ tableName: 'categories', underscored: true })
export class Category extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @Unique
  @Column(DataType.STRING)
  declare name: string;

  @HasMany(() => Event)
  declare events?: Event[];
}
