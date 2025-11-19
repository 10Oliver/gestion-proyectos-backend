import { Table, Column, Model, DataType, ForeignKey, PrimaryKey } from 'sequelize-typescript';

import { Event } from './event.model';
import { User } from './user.model';

@Table({ tableName: 'event_attendees', underscored: true, timestamps: true })
export class EventAttendee extends Model {
  @PrimaryKey
  @ForeignKey(() => Event)
  @Column(DataType.UUID)
  declare eventId: string;

  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare userId: string;
}
