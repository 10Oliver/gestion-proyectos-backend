import { Sequelize } from 'sequelize-typescript';

import { env } from '../config/env';
import { Category } from './models/category.model';
import { Event } from './models/event.model';
import { EventAttendee } from './models/event-attendee.model';
import { RefreshToken } from './models/refresh-token.model';
import { User } from './models/user.model';

const logging = env.nodeEnv === 'development' ? console.log : false;

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  models: [User, Category, Event, EventAttendee, RefreshToken],
  logging,
});

export const connectDatabase = async () => {
  await sequelize.authenticate();
};
