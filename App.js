import React, { useState } from "react";
import type { Node } from "react";
import { LogBox, ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import "react-native-gesture-handler"

import { keys } from "./src/Constants";
import styles from "./src/Styles";
import epilogueStorage from "./src/Storage";
import { SFSymbol } from "./src/SFSymbols";

import { HomeScreen } from "./src/HomeScreen";
import { BookDetailsScreen } from "./src/BookDetailsScreen";
import { PostScreen } from "./src/PostScreen";
import { SignInScreen } from "./src/SignInScreen";
import { BlogsScreen } from "./src/BlogsScreen";
	
const Stack = createNativeStackNavigator();

const EpilogueDarkTheme = {
  dark: true,
  colors: {
    card: "#131724"
  }
};

const App: () => Node = () => {	
  const is_dark = (useColorScheme() == "dark");

  LogBox.ignoreAllLogs();
  epilogueStorage.remove(keys.currentSearch);

  return (
  	<NavigationContainer theme={is_dark ? EpilogueDarkTheme : DefaultTheme}>
  		<Stack.Navigator>
  			<Stack.Group>
  				<Stack.Screen name="Home" component={HomeScreen} options={{
  					headerTitle: "",
  					headerLeft: () => (
  						<Image style={styles.profileIcon} source={{ uri: "https://micro.blog/images/blank_avatar.png" }} />
  					),
  					headerRight: () => (
  						<MenuView
  							actions = {[]}
  							>
  							<Text></Text>
  						</MenuView>
  					)					
  				}} />
  				<Stack.Screen name="Details" component={BookDetailsScreen} options={({ navigation, route }) => ({
  					headerTitle: "",
  					headerLeft: () => (
  						<Pressable onPress={() => { navigation.goBack(); }}>
                <SFSymbol name="chevron.left" scale="large" color={is_dark ? "#FFFFFF" : "#337AB7"} size={16} resizeMode="center" style={styles.navbarBackIcon} />                
  						</Pressable>
  					),
  					headerRight: () => (
              <Pressable onPress={() => { navigation.navigate("Post"); }}>
                <SFSymbol name="square.and.pencil" scale="large" color={is_dark ? "#FFFFFF" : "#337AB7"} size={16} resizeMode="center" style={styles.navbarNewIcon} />                
              </Pressable>
  					)
  				})} />
  			</Stack.Group>
  			<Stack.Group screenOptions={{ presentation: "modal" }}>
  				<Stack.Screen name="Post" component={PostScreen} options={({ navigation, route }) => ({
            headerTitle: "",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }}>
                <SFSymbol name="xmark" scale="large" color={is_dark ? "#FFFFFF" : "#337AB7"} size={16} resizeMode="center" style={is_dark ? [ styles.navbarCloseIcon, styles.dark.navbarCloseIcon ] : styles.navbarCloseIcon} />                         
              </Pressable>
            ),
            headerRight: () => (
              <Pressable onPress={() => { }}>
                <Text style={is_dark ? [ styles.navbarSubmit, styles.dark.navbarSubmit ] : styles.navbarSubmit}>Post</Text>
              </Pressable>
            )
          })} />
          <Stack.Screen name="SignIn" component={SignInScreen} options={({ navigation, route }) => ({
            headerTitle: "",
            headerRight: () => (
              <Pressable onPress={() => { }}>
                <Text style={is_dark ? [ styles.navbarSubmit, styles.dark.navbarSubmit ] : styles.navbarSubmit}>Sign In</Text>
              </Pressable>
            )
          })} />
          <Stack.Screen name="Blogs" component={BlogsScreen} options={({ navigation, route }) => ({
            headerTitle: "Blogs",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }}>
                <SFSymbol name="xmark" scale="large" color={is_dark ? "#FFFFFF" : "#337AB7"} size={16} resizeMode="center" style={is_dark ? [ styles.navbarCloseIcon, styles.dark.navbarCloseIcon ] : styles.navbarCloseIcon} />                         
              </Pressable>
            )
          })} />
  			</Stack.Group>
  		</Stack.Navigator>
  	</NavigationContainer>
  );
}

export default App;
