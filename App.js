import React, { useState } from "react";
import type { Node } from "react";
import { Alert, LogBox, ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView, Platform } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import "react-native-gesture-handler";
import changeNavigationBarColor from "react-native-navigation-bar-color";

import { keys } from "./src/Constants";
import { useEpilogueStyle } from './src/hooks/useEpilogueStyle';
import epilogueStorage from "./src/Storage";
import { Icon } from "./src/Icon";

import { HomeScreen } from "./src/HomeScreen";
import { TabsScreen } from "./src/TabsScreen";
import { BookDetailsScreen } from "./src/BookDetailsScreen";
import { PostScreen } from "./src/PostScreen";
import { SignInScreen } from "./src/SignInScreen";
import { BlogsScreen } from "./src/BlogsScreen";
import { ProfileScreen } from "./src/ProfileScreen";
import { ExternalScreen } from "./src/ExternalScreen";
import { EditGoalScreen } from "./src/EditGoalScreen";
import { CreateAccountScreen } from "./src/CreateAccountScreen";
import { OpenEditionsScreen } from "./src/screens/OpenEditionsScreen";
import { OpenDetailsScreen } from "./src/screens/OpenDetailsScreen";
import { OpenCoversScreen } from "./src/screens/OpenCoversScreen";
import { DateScreen } from "./src/screens/DateScreen";
	
const Stack = createNativeStackNavigator();

const EpilogueDarkTheme = {
  dark: true,
  colors: {
    card: "#131724"
  }
};

const App: () => Node = () => {	
  const styles = useEpilogueStyle()
  const is_dark = (useColorScheme() == "dark");

  LogBox.ignoreAllLogs();
  epilogueStorage.remove(keys.currentSearch);
  
  if (Platform.OS == "android") {
    changeNavigationBarColor(is_dark ? "#141723" : "#FFFFFF");
  }

  return (
  	<NavigationContainer theme={is_dark ? EpilogueDarkTheme : DefaultTheme}>
  		<Stack.Navigator>
        <Stack.Group>
          <Stack.Screen name="Tabs" component={TabsScreen} options={{
            headerShown: false
          }} />
        </Stack.Group>
  			<Stack.Group>
  				<Stack.Screen name="Home" component={HomeScreen} options={{
  					title: "",
  					headerLeft: () => (
  						<Image style={styles.profileIcon} source={{ uri: "https://micro.blog/images/blank_avatar.png" }} />
  					)
  				}} />
  				<Stack.Screen name="Details" component={BookDetailsScreen} options={({ navigation, route }) => ({
  					title: "",
  					headerLeft: () => (
  						<Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                          <Icon name="navbar-back" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarBackIcon} />
  						</Pressable>
  					),
  					headerRight: () => (
              <Pressable onPress={() => { navigation.navigate("Post", { books: [] }); }} hitSlop={10}>
                <Icon name="publish" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarNewIcon} accessibilityLabel="new post" />
              </Pressable>
  					)
  				})} />
          <Stack.Screen name="Editions" component={OpenEditionsScreen} options={({ navigation, route }) => ({
            title: "Editions",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                          <Icon name="navbar-back" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarBackIcon} />
              </Pressable>
            )
          })} />
          <Stack.Screen name="OLDetails" component={OpenDetailsScreen} options={({ navigation, route }) => ({
            title: "Details",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                          <Icon name="navbar-back" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarBackIcon} />
              </Pressable>
            )
          })} />
  			</Stack.Group>
  			<Stack.Group screenOptions={{ presentation: "modal" }}>
  				<Stack.Screen name="Post" component={PostScreen} options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="close" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarCloseIcon} />
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
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="close" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarCloseIcon} />
              </Pressable>
            )
          })} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="close" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarCloseIcon} />
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
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="close" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarCloseIcon} />
              </Pressable>
            )
          })} />
          <Stack.Screen name="EditGoal" component={EditGoalScreen} options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="close" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarCloseIcon} />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable onPress={() => { navigation.navigate("Post", { books: [] }); }} hitSlop={10}>
                <Icon name="publish" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarNewIcon} accessibilityLabel="new post" />
              </Pressable>
            )
          })} />
          <Stack.Screen name="Covers" component={OpenCoversScreen} options={({ navigation, route }) => ({
            title: "Covers",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="close" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarCloseIcon} />
              </Pressable>
            )
          })} />
          <Stack.Screen name="DatePicker" component={DateScreen} options={({ navigation, route }) => ({
            title: "Finished Date",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="close" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarCloseIcon} />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable onPress={() => { }}>
                <Text style={styles.navbarSubmit}>Update</Text>
              </Pressable>
            )
          })} />
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen name="SignIn" component={SignInScreen} options={({ navigation, route }) => ({
            title: "Epilogue",
            headerBackVisible: false
          })} />
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen name="Username" component={CreateAccountScreen} options={({navigation, route}) => ({
            title: "Username",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }} hitSlop={10}>
                <Icon name="navbar-back" color={is_dark ? "#FFFFFF" : "#337AB7"} size={18} style={styles.navbarBackIcon} />
              </Pressable>
            ),
          })}/>
        </Stack.Group>
  		</Stack.Navigator>
  	</NavigationContainer>
  );
}

export default App;
