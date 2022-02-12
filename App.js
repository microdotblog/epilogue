import React, { useState } from "react";
import type { Node } from "react";
import { ActivityIndicator, useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";

import { styles } from "./src/Styles";

let auth_token = "";

import { HomeScreen } from "./src/HomeScreen";
import { BookDetailsScreen } from "./src/BookDetailsScreen";
  
const Stack = createNativeStackNavigator();	
  
const App: () => Node = () => {  
  const isDarkMode = useColorScheme() === "dark";

  return (
    <NavigationContainer>
      <Stack.Navigator>
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
            <Image style={styles.navbarNewIcon} source={require("./images/create.png")} />
          )
        })} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
