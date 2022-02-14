import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";
import "react-native-gesture-handler"

import styles from "./src/Styles";
import epilogueStorage from "./src/Storage";

import { HomeScreen } from "./src/HomeScreen";
import { BookDetailsScreen } from "./src/BookDetailsScreen";
import { PostScreen } from "./src/PostScreen";
	
const Stack = createNativeStackNavigator();

const EpilogueDarkTheme = {
  dark: true,
  colors: {
    card: "#131724"
  }
};

const App: () => Node = () => {	
  const is_dark = (useColorScheme() == "dark");
  
  return (
  	<NavigationContainer theme={is_dark ? EpilogueDarkTheme : DefaultTheme}>
  		<Stack.Navigator>
  			<Stack.Group>
  				<Stack.Screen name="Home" component={HomeScreen} options={{
  					headerTitle: "",
  					headerLeft: () => (
  						<Image style={styles.profileIcon} source={{ uri: "https://micro.blog/manton/avatar.jpg" }} />
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
  							<Image style={styles.navbarBackIcon} source={require("./images/back.png")} />
  						</Pressable>
  					),
  					headerRight: () => (
              <Pressable onPress={() => { navigation.navigate("Post"); }}>
  						  <Image style={styles.navbarNewIcon} source={require("./images/create.png")} />
              </Pressable>
  					)
  				})} />
  			</Stack.Group>
  			<Stack.Group screenOptions={{ presentation: "modal" }}>
  				<Stack.Screen name="Post" component={PostScreen} options={({ navigation, route }) => ({
            headerTitle: "",
            headerLeft: () => (
              <Pressable onPress={() => { navigation.goBack(); }}>
                <Image style={styles.navbarCloseIcon} source={require("./images/close.png")} />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable onPress={() => { }}>
                <Text style={styles.navbarPost}>Post</Text>
              </Pressable>
            )
          })} />
  			</Stack.Group>
  		</Stack.Navigator>
  	</NavigationContainer>
  );
}

export default App;
