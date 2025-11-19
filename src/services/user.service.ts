import { User } from '../database/models/user.model';
import { SocialProfile } from './social-auth.service';

type UserProfileUpdate = {
  description?: string | null;
  address?: string | null;
  photoUrl?: string | null;
};

export const findOrCreateSocialUser = async (profile: SocialProfile) => {
  const [user] = await User.findOrCreate({
    where: {
      provider: profile.provider,
      providerUserId: profile.providerUserId,
    },
    defaults: {
      name: profile.name,
      email: profile.email ?? null,
      photoUrl: profile.avatarUrl ?? null,
      provider: profile.provider,
      providerUserId: profile.providerUserId,
    },
  });

  user.lastLoginAt = new Date();
  if (!user.email && profile.email) {
    user.email = profile.email;
  }
  if (profile.avatarUrl) {
    user.photoUrl = profile.avatarUrl;
  }
  if (!user.name && profile.name) {
    user.name = profile.name;
  }

  await user.save();

  return user;
};

export const getUserById = (id: string) =>
  User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'photoUrl', 'description', 'address', 'provider', 'role'],
  });

export const updateUserProfile = async (id: string, payload: UserProfileUpdate) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  user.description = payload.description ?? user.description;
  user.address = payload.address ?? user.address;
  user.photoUrl = payload.photoUrl ?? user.photoUrl;
  await user.save();

  return user;
};
