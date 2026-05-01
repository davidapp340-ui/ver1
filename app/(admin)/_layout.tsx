import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Dumbbell, Map, LayoutGrid, Palette, BarChart3 } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';

export default function AdminLayout() {
  const { isUnlocked } = useAdmin();
  const { t } = useTranslation();

  if (!isUnlocked) {
    return <Redirect href="/admin-unlock" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        tabBarActiveTintColor: '#0F172A',
      }}
    >
      <Tabs.Screen
        name="exercises"
        options={{
          title: t('admin.tabs.exercises', { defaultValue: 'תרגילים' }),
          tabBarIcon: ({ color, size }) => <Dumbbell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="daily-plans"
        options={{
          title: t('admin.tabs.plans', { defaultValue: 'מסלול 30 יום' }),
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: t('admin.tabs.library', { defaultValue: 'גלריה' }),
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="taxonomy"
        options={{
          title: t('admin.tabs.taxonomy', { defaultValue: 'קטגוריות גלריה' }),
          tabBarIcon: ({ color, size }) => <Palette size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('admin.tabs.stats', { defaultValue: 'נתונים' }),
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
