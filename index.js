/**
 * @format
 */

import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import {AppRegistry} from 'react-native';
import { gestureHandlerRootHOC } from 'react-native-gesture-handler';
import App from './App';

AppRegistry.registerComponent('epilogue', () => gestureHandlerRootHOC(App));
