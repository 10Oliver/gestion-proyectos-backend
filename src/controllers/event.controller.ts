import { NextFunction, Request, Response } from 'express';

import {
  addAttendee,
  createEvent,
  deleteEvent,
  getEventById,
  listUpcomingEvents,
  removeAttendee,
  updateEvent,
} from '../services/event.service';
import { serializeEvent } from '../utils/serializers';

type EventCreateBody = {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  imageUrl?: string | null;
  capacity?: number | null;
  categoryId: number;
};

type EventUpdateBody = Partial<EventCreateBody>;

export const listEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sort = 'asc', limit = 10 } = req.query as {
      sort?: 'asc' | 'desc';
      limit?: number;
    };
    const events = await listUpcomingEvents({ sort, limit });
    res.json(events.map(serializeEvent));
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(serializeEvent(event));
  } catch (error) {
    next(error);
  }
};

export const postEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
  const body = req.body as EventCreateBody;
    const event = await createEvent({
      ...body,
      description: body.description ?? null,
      location: body.location ?? null,
      endsAt: body.endsAt ?? null,
      imageUrl: body.imageUrl ?? null,
      capacity: body.capacity ?? null,
      createdBy: req.user.id,
    });
  res.status(201).json(serializeEvent(event));
  } catch (error) {
    next(error);
  }
};

export const patchEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const existing = await getEventById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (existing.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only creators or admins can edit events' });
    }
  const updates = req.body as EventUpdateBody;
  const updated = await updateEvent(req.params.id, updates);
  res.json(serializeEvent(updated));
  } catch (error) {
    next(error);
  }
};

export const removeEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const existing = await getEventById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (existing.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only creators or admins can delete events' });
    }
    await deleteEvent(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const attendEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
  const event = await addAttendee(req.params.id, req.user.id);
  res.status(201).json(serializeEvent(event));
  } catch (error) {
    next(error);
  }
};

export const unAttendEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const { userId } = req.params;
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can remove other attendees' });
    }
    await removeAttendee(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
