import React, { useState } from "react";
import type { Node } from "react";
import { Alert, LogBox, ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView, Platform, StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import changeNavigationBarColor from "react-native-navigation-bar-color";
import "react-native-gesture-handler";

import { keys } from "./src/Constants";
import { useEpilogueStyle } from './src/hooks/useEpilogueStyle';
import epilogueStorage from "./src/Storage";
import { Icon } from "./src/Icon";

import { HomeScreen } from "./src/screens/HomeScreen";
import { TabsScreen } from "./src/screens/TabsScreen";
import { contentStackScreens } from "./src/navigation/ContentStackScreens";
import { PostScreen } from "./src/screens/PostScreen";
import { SignInScreen } from "./src/screens/SignInScreen";
import { BlogsScreen } from "./src/screens/BlogsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ExternalScreen } from "./src/screens/ExternalScreen";
import { CreateAccountScreen } from "./src/screens/CreateAccountScreen";
import { NotesKeyScreen } from "./src/screens/NotesKeyScreen";

const Stack = createNativeStackNavigator();

const EpilogueDarkTheme = {
  dark: true,
  colors: {
    background: "#131724",
    card: "#131724",
    text: "#FFFFFF",
    primary: "#FFFFFF",
    border: "#242A3D",
    notification: "#FFFFFF"
  },
  fonts: DefaultTheme.fonts
};

const App: () => Node = () => {	
  const styles = useEpilogueStyle()
  const is_dark = (useColorScheme() == "dark");
  const systemBarBackgroundColor = is_dark ? "#141723" : "#FFFFFF";
  const statusBarStyle = is_dark ? "light-content" : "dark-content";

  LogBox.ignoreAllLogs();
  epilogueStorage.remove(keys.currentSearch);
  
  if (Platform.OS == "android") {
    changeNavigationBarColor(systemBarBackgroundColor, !is_dark);
  }

  return (
    <>
      <StatusBar
        backgroundColor={systemBarBackgroundColor}
        barStyle={statusBarStyle}
        translucent={false}
      />
      <NavigationContainer theme={is_dark ? EpilogueDarkTheme : DefaultTheme}>
      <Stack.Navigator
        screenOptions={{
          headerLeftContainerStyle: { paddingLeft: 15 },
          headerRightContainerStyle: { paddingRight: 15 },
          headerTintColor: is_dark ? "#FFFFFF" : "#000000"
        }}
      >
          <Stack.Group>
            <Stack.Screen name="Tabs" component={TabsScreen} options={{
              headerShown: false
            }} />
          </Stack.Group>
          <Stack.Group>
            <Stack.Screen name="Home" component={HomeScreen} options={{
              title: "",
              headerTintColor: is_dark ? "#FFFFFF" : "#000000",
              headerLeft: () => (
                <Image style={styles.profileIcon} source={{ uri: "https://micro.blog/images/blank_avatar.png" }} />
              )
            }} />
          </Stack.Group>
          {contentStackScreens(Stack, styles, is_dark)}
          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen name="Post" component={PostScreen} options={({ navigation, route }) => ({
              title: "",
              headerLeft: () => (
                <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="close">
                  <Icon name="close" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarCloseIcon} />
                </Pressable>
              ),
              headerRight: () => (
                <Pressable onPress={() => { }}>
                  <Text style={styles.navbarSubmit}>Post</Text>
                </Pressable>
              )
            })} />
            <Stack.Screen name="Blogs" component={BlogsScreen} options={({ navigation, route }) => ({
              title: "Blogs",
              headerTintColor: is_dark ? "#FFFFFF" : "#000000",
              headerLeft: () => (
                <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="close">
                  <Icon name="close" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarCloseIcon} />
                </Pressable>
              )
            })} />
            <Stack.Screen name="NotesKey" component={NotesKeyScreen} options={({ navigation, route }) => ({
              title: "",
              headerLeft: () => (
                <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="close">
                  <Icon name="close" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarCloseIcon} />
                </Pressable>
              )
            })} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={({ navigation, route }) => ({
              title: "",
              headerLeft: () => (
                <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="close">
                  <Icon name="close" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarCloseIcon} />
                </Pressable>
              ),
              headerRight: () => (
                <Pressable onPress={() => { }}>
                  <Text style={styles.navbarSubmit}>Sign Out</Text>
                </Pressable>
              )
            })} />
            <Stack.Screen name="External" component={ExternalScreen} options={({ navigation, route }) => ({
              title: "",
              headerLeft: () => (
                <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="close">
                  <Icon name="close" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarCloseIcon} />
                </Pressable>
              )
            })} />
          </Stack.Group>
          <Stack.Group>
            <Stack.Screen name="SignIn" component={SignInScreen} options={({ navigation, route }) => ({
              title: "Epilogue",
              headerBackVisible: false,
              headerBackTitle: "",
              headerBackTitleVisible: false,
              headerLeft: () => null,
              headerTintColor: is_dark ? "#FFFFFF" : "#000000"
            })} />
          </Stack.Group>
          <Stack.Group>
            <Stack.Screen name="Username" component={CreateAccountScreen} options={({navigation, route}) => ({
              title: "Username",
              headerLeft: () => (
                <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel="back">
                  <Icon name="navbar-back" color={is_dark ? "#FFFFFF" : "#000000"} size={18} style={styles.navbarBackIcon} />
                </Pressable>
              ),
            })}/>
          </Stack.Group>
      </Stack.Navigator>
      </NavigationContainer>
    </>
  	
  );
}

export default App;
