import { Request, Response, NextFunction } from 'express';

import {
  listEventsAttendingByUser,
  listEventsCreatedByUser,
} from '../services/event.service';
import { getUserById, updateUserProfile } from '../services/user.service';
import { serializeEvent, serializeUser } from '../utils/serializers';

type UserProfilePayload = {
  description?: string | null;
  address?: string | null;
  photoUrl?: string | null;
};

export const getMe = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  res.json(serializeUser(req.user));
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

  const payload = req.body as UserProfilePayload;
  const updated = await updateUserProfile(req.user.id, payload);
    res.json(serializeUser(updated));
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(serializeUser(user));
  } catch (error) {
    next(error);
  }
};

export const getUserCreatedEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await listEventsCreatedByUser(req.params.id);
    res.json(events.map(serializeEvent));
  } catch (error) {
    next(error);
  }
};

export const getUserAttendingEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await listEventsAttendingByUser(req.params.id);
    res.json(events.map(serializeEvent));
  } catch (error) {
    next(error);
  }
};
