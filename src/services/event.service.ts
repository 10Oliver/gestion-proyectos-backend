import { Op, WhereOptions } from 'sequelize';

import { Category } from '../database/models/category.model';
import { Event } from '../database/models/event.model';
import { EventAttendee } from '../database/models/event-attendee.model';
import { User } from '../database/models/user.model';

const createEventIncludes = () => [
  { model: Category, attributes: ['id', 'name'] },
  { model: User, as: 'creator', attributes: ['id', 'name', 'photoUrl'] },
  {
    model: User,
    as: 'attendees',
    attributes: ['id', 'name', 'photoUrl'],
    through: { attributes: [] },
  },
];

export const listUpcomingEvents = ({
  sort = 'asc',
  limit = 10,
}: {
  sort?: 'asc' | 'desc';
  limit?: number;
}) =>
  Event.findAll({
    where: { startsAt: { [Op.gte]: new Date() } },
    order: [['startsAt', sort.toLowerCase() === 'desc' ? 'DESC' : 'ASC']],
    limit,
    include: createEventIncludes(),
  });

export const getEventById = (id: string) =>
  Event.findByPk(id, {
    include: createEventIncludes(),
  });

export const createEvent = async (
  payload: Pick<
    Event,
    'title' | 'description' | 'location' | 'startsAt' | 'endsAt' | 'imageUrl' | 'capacity'
  > & { categoryId: number; createdBy: string },
) => {
  await Category.findByPk(payload.categoryId, { rejectOnEmpty: true });
  const event = await Event.create(payload);
  const full = await getEventById(event.id);
  if (!full) {
    throw new Error('Failed to load event after creation');
  }
  return full;
};

export const updateEvent = async (
  id: string,
  payload: Partial<
    Pick<
      Event,
      'title' | 'description' | 'location' | 'startsAt' | 'endsAt' | 'imageUrl' | 'capacity' | 'categoryId'
    >
  >,
) => {
  const event = await Event.findByPk(id);
  if (!event) {
    throw Object.assign(new Error('Event not found'), { status: 404 });
  }

  if (payload.categoryId) {
    await Category.findByPk(payload.categoryId, { rejectOnEmpty: true });
  }

  event.set(payload);
  await event.save();
  const full = await getEventById(event.id);
  if (!full) {
    throw new Error('Failed to load event after update');
  }
  return full;
};

export const deleteEvent = async (id: string) => {
  const deleted = await Event.destroy({ where: { id } });
  if (!deleted) {
    throw Object.assign(new Error('Event not found'), { status: 404 });
  }
};

export const addAttendee = async (eventId: string, userId: string) => {
  const event = await Event.findByPk(eventId);
  if (!event) {
    throw Object.assign(new Error('Event not found'), { status: 404 });
  }

  await EventAttendee.findOrCreate({ where: { eventId, userId } });
  const updatedEvent = await getEventById(eventId);
  if (!updatedEvent) {
    throw new Error('Failed to load event after attendance update');
  }
  return updatedEvent;
};

export const removeAttendee = async (eventId: string, userId: string) => {
  const deleted = await EventAttendee.destroy({ where: { eventId, userId } });
  if (!deleted) {
    throw Object.assign(new Error('Attendance not found'), { status: 404 });
  }
};

export const listEventsCreatedByUser = (userId: string) =>
  Event.findAll({ where: { createdBy: userId }, include: createEventIncludes() });

export const listEventsAttendingByUser = (userId: string) =>
  Event.findAll({
    include: createEventIncludes(),
    where: { '$attendees.id$': userId } as WhereOptions<Event>,
  });
