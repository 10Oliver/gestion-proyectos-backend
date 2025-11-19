import { Category } from '../database/models/category.model';
import { Event } from '../database/models/event.model';
import { User } from '../database/models/user.model';

export const serializeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  photoUrl: user.photoUrl,
  description: user.description,
  address: user.address,
  provider: user.provider,
  role: user.role,
  lastLoginAt: user.lastLoginAt,
});

export const serializeCategory = (category: Category) => ({
  id: category.id,
  name: category.name,
});

export const serializeEvent = (event: Event) => ({
  id: event.id,
  title: event.title,
  description: event.description,
  location: event.location,
  startsAt: event.startsAt,
  endsAt: event.endsAt,
  imageUrl: event.imageUrl,
  capacity: event.capacity,
  categoryId: event.categoryId,
  createdBy: event.createdBy,
  category: event.category ? serializeCategory(event.category) : undefined,
  creator: event.creator ? serializeUser(event.creator) : undefined,
  attendees: event.attendees ? event.attendees.map((attendee) => serializeUser(attendee)) : [],
  attendeesCount: event.attendees ? event.attendees.length : 0,
});
