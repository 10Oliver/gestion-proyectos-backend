import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo, AllowNull } from 'sequelize-typescript';

import { User } from './user.model';

@Table({ tableName: 'refresh_tokens', underscored: true })
export class RefreshToken extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare tokenHash: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare revoked: boolean;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User)
  declare user?: User;
}
