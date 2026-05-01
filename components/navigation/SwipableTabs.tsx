import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type { MaterialTopTabNavigationOptions } from '@react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';

const { Navigator } = createMaterialTopTabNavigator();

const BottomNavigator = (props: React.ComponentProps<typeof Navigator>) => (
  <Navigator {...props} tabBarPosition="bottom" />
);

export const SwipableTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof BottomNavigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(BottomNavigator);

type MaterialTopTabNavigationEventMap = {
  tabPress: {
    data: { isAlreadyFocused: boolean };
    canPreventDefault: true;
  };
  tabLongPress: { data: undefined };
  swipeStart: { data: undefined };
  swipeEnd: { data: undefined };
};

export default SwipableTabs;
