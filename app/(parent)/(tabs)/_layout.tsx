import { Platform } from 'react-native';
import { Home, Lightbulb, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SwipableTabs } from '@/components/navigation/SwipableTabs';

export default function ParentTabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.select({
    ios: 80 + insets.bottom,
    android: 75,
    default: 75,
  });

  const tabBarPaddingBottom = Platform.select({
    ios: Math.max(insets.bottom, 8),
    android: 12,
    default: Math.max(insets.bottom, 8),
  });

  return (
    <SwipableTabs
      screenOptions={{
        tabBarScrollEnabled: false,
        swipeEnabled: true,
        lazy: true,
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarPressColor: 'transparent',
        tabBarIndicatorStyle: {
          backgroundColor: '#4F46E5',
          height: 3,
          borderRadius: 2,
          position: 'absolute',
          top: 0,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: tabBarPaddingBottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          paddingHorizontal: 1,
          height: tabBarHeight - tabBarPaddingBottom,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          textTransform: 'none',
          marginTop: 2,
          marginBottom: Platform.select({
            ios: 0,
            android: 4,
            default: 2,
          }),
        },
        tabBarIconStyle: {
          marginTop: Platform.select({
            ios: 2,
            android: 0,
            default: 0,
          }),
        },
      }}
    >
      <SwipableTabs.Screen
        name="home"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <SwipableTabs.Screen
        name="science"
        options={{
          title: t('nav.science'),
          tabBarIcon: ({ color }) => <Lightbulb size={20} color={color} />,
        }}
      />
      <SwipableTabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
        }}
      />
    </SwipableTabs>
  );
}
