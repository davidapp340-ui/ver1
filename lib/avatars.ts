import { ImageSourcePropType } from 'react-native';

export interface AvatarEntry {
  id: string;
  source: ImageSourcePropType;
  label: string;
  color: string;
  emoji: string;
}

export const AVATARS: Record<string, AvatarEntry> = {
  default: {
    id: 'default',
    source: require('../assets/images/avatars/default.png'),
    label: 'Star',
    color: '#10B981',
    emoji: '\u2B50',
  },
  lion: {
    id: 'lion',
    source: require('../assets/images/avatars/lion.png'),
    label: 'Lion',
    color: '#F59E0B',
    emoji: '\uD83E\uDD81',
  },
  robot: {
    id: 'robot',
    source: require('../assets/images/avatars/robot.png'),
    label: 'Robot',
    color: '#3B82F6',
    emoji: '\uD83E\uDD16',
  },
  rabbit: {
    id: 'rabbit',
    source: require('../assets/images/avatars/rabbit.png'),
    label: 'Rabbit',
    color: '#EC4899',
    emoji: '\uD83D\uDC30',
  },
  astronaut: {
    id: 'astronaut',
    source: require('../assets/images/avatars/astronaut.png'),
    label: 'Astronaut',
    color: '#8B5CF6',
    emoji: '\uD83D\uDE80',
  },
};

export const AVATAR_LIST = Object.values(AVATARS);

export const getAvatarEntry = (id: string): AvatarEntry =>
  AVATARS[id] || AVATARS['default'];
