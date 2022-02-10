import React, { useState } from "react";
import type { Node } from "react";
import { useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SFSymbol } from "react-native-sfsymbols";

function HomeScreen({ navigation }) {
  const [ data, setData ] = useState();
  let auth_token = "";
  
  function loadBooks(bookshelf_id) {
    var options = {
      headers: {
        "Authorization": "Bearer " + auth_token
      }
    };
    fetch("https://micro.blog/books/bookshelves/" + bookshelf_id, options).then(response => response.json()).then(data => {
      var new_items = [];
      for (let item of data.items) {
        new_items.push({
          id: item.id,
          title: item.title,
          image: item.image,
          author: item.authors[0].name
        });
      }
      setData(new_items);
    });		
  }

  function onBooksPressed() {
    loadBooks(7);
  }

  function onShowBookPressed(item) {
    navigation.navigate("Details", item);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data = {data}
        renderItem = { ({item}) => 
          <Pressable onPress={() => { onShowBookPressed(item) }}>
            <View style={styles.item}>
              <Image style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
              <View>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>{item.author}</Text>
              </View>
            </View>
          </Pressable>
        }
        keyExtractor = { item => item.id }
      />
      <Button title="Load Books" onPress={onBooksPressed} />
    </View>
  );
}

function BookDetailsScreen({ route, navigation }) {
  const [ data, setData ] = useState();
  const { id, title, image, author } = route.params;
    
  return (
    <View style={styles.container}>
      <Image style={styles.bookDetailCover} source={{ uri: image }} />
      <Text>{title}</Text>
      <Text>{author}</Text>
    </View>
  );
}
  
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
            <Button
              onPress={() => alert("Test.")}
              title="Currently reading"
            />
          )					
        }} />
        <Stack.Screen name="Details" component={BookDetailsScreen} options={{
          title: ""
        }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10,
    marginBottom: 50
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12
  },
  item: {
    flexDirection: "row",
    height: 90,
    marginLeft: 20,
    marginRight: 20,
    paddingBottom: 10
  },
  bookTitle: {
    marginTop: 5,
    padding: 5
  },
  bookAuthor: {
    padding: 5,
    color: "#777777"
  },
  bookCover: {
    width: 50,
    height: 70
  },
  bookDetailCover: {
    width: 100,
    height: 150
  }
});

export default App;

// import React from 'react';
// import type {Node} from 'react';
// import {
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   useColorScheme,
//   View,
// } from 'react-native';
// 
// import {
//   Colors,
//   DebugInstructions,
//   Header,
//   LearnMoreLinks,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';
// 
// const Section = ({children, title}): Node => {
//   const isDarkMode = useColorScheme() === 'dark';
//   return (
//     <View style={styles.sectionContainer}>
//       <Text
//         style={[
//           styles.sectionTitle,
//           {
//             color: isDarkMode ? Colors.white : Colors.black,
//           },
//         ]}>
//         {title}
//       </Text>
//       <Text
//         style={[
//           styles.sectionDescription,
//           {
//             color: isDarkMode ? Colors.light : Colors.dark,
//           },
//         ]}>
//         {children}
//       </Text>
//     </View>
//   );
// };
// 
// const App: () => Node = () => {
//   const isDarkMode = useColorScheme() === 'dark';
// 
//   const backgroundStyle = {
//     backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
//   };
// 
//   return (
//     <SafeAreaView style={backgroundStyle}>
//       <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
//       <ScrollView
//         contentInsetAdjustmentBehavior="automatic"
//         style={backgroundStyle}>
//         <Header />
//         <View
//           style={{
//             backgroundColor: isDarkMode ? Colors.black : Colors.white,
//           }}>
//           <Section title="Step One">
//             Edit <Text style={styles.highlight}>App.js</Text> to change this
//             screen and then come back to see your edits.
//           </Section>
//           <Section title="See Your Changes">
//             <ReloadInstructions />
//           </Section>
//           <Section title="Debug">
//             <DebugInstructions />
//           </Section>
//           <Section title="Learn More">
//             Read the docs to discover what to do next:
//           </Section>
//           <LearnMoreLinks />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };
// 
// const styles = StyleSheet.create({
//   sectionContainer: {
//     marginTop: 32,
//     paddingHorizontal: 24,
//   },
//   sectionTitle: {
//     fontSize: 24,
//     fontWeight: '600',
//   },
//   sectionDescription: {
//     marginTop: 8,
//     fontSize: 18,
//     fontWeight: '400',
//   },
//   highlight: {
//     fontWeight: '700',
//   },
// });
// 
// export default App;
