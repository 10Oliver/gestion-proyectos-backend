import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  Unique,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';

import { Event } from './event.model';
import { EventAttendee } from './event-attendee.model';
import { RefreshToken } from './refresh-token.model';

export type AuthProvider = 'facebook' | 'instagram' | 'google' | 'x' | 'local';

@Table({ tableName: 'users', underscored: true })
export class User extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(true)
  @Unique
  @Column(DataType.STRING)
  declare email: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare description: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare address: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare photoUrl: string | null;

  @AllowNull(false)
  @Default('local')
  @Column(DataType.STRING)
  declare provider: AuthProvider;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare providerUserId: string | null;

  @AllowNull(false)
  @Default('user')
  @Column(DataType.STRING)
  declare role: 'user' | 'admin';

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastLoginAt: Date | null;

  @HasMany(() => Event, 'createdBy')
  declare createdEvents?: Event[];

  @BelongsToMany(() => Event, () => EventAttendee)
  declare attendingEvents?: Event[];

  @HasMany(() => RefreshToken)
  declare refreshTokens?: RefreshToken[];
}
