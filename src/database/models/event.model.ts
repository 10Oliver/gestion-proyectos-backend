import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
} from 'sequelize-typescript';

import { Category } from './category.model';
import { EventAttendee } from './event-attendee.model';
import { User } from './user.model';

@Table({ tableName: 'events', underscored: true })
export class Event extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare location: string | null;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare startsAt: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare endsAt: Date | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare imageUrl: string | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare capacity: number | null;

  @ForeignKey(() => Category)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare categoryId: number;

  @BelongsTo(() => Category)
  declare category?: Category;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare createdBy: string;

  @BelongsTo(() => User, 'createdBy')
  declare creator?: User;

  @BelongsToMany(() => User, () => EventAttendee)
  declare attendees?: User[];
}
