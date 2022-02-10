import React, { useState } from "react";
import type { Node } from "react";
import { useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SFSymbol } from "react-native-sfsymbols";
import { MenuView } from "@react-native-menu/menu";

function HomeScreen({ navigation }) {
  const [ data, setData ] = useState();
  let auth_token = "";
  var current_bookshelf = {};
  
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      onFocus(navigation);
    });
  
    // returns the function to unsubscribe from the event so it gets removed on unmount
    return unsubscribe;
  }, [navigation]);
  
  function onFocus(navigation) {
    loadBookshelves(navigation)
  }
  
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
  
  function loadBookshelves(navigation) {
    var options = {
      headers: {
        "Authorization": "Bearer " + auth_token
      }
    };
    fetch("https://micro.blog/books/bookshelves", options).then(response => response.json()).then(data => {
      var new_items = [];
      for (let item of data.items) {
        new_items.push({
          id: item.id.toString(),
          title: item.title
        });
      }

      current_bookshelf = data.items[0];
      
      navigation.setOptions({
        headerRight: () => (
          <MenuView
            onPressAction = {({ nativeEvent }) => {
              let shelf_id = nativeEvent.event;
              loadBooks(shelf_id);
            }}
            actions = {new_items}
            >
            <Text>{current_bookshelf.title}</Text>
          </MenuView>
        )
      });
    });		
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
    </View>
  );
}

function BookDetailsScreen({ route, navigation }) {
  const [ data, setData ] = useState();
  const { id, title, image, author } = route.params;
    
  return (
    <View style={styles.container}>
      <Image style={styles.bookDetailCover} source={{ uri: image.replace("http://", "https://") }} />
      <Text>{title}</Text>
      <Text>{author}</Text>
    </View>
  );
}
  
const Stack = createNativeStackNavigator();	
  
const App: () => Node = () => {  
  const [ bookshelves, setBookshelves ] = useState([]);
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
              actions = {bookshelves}
              >
              <Text></Text>
            </MenuView>
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
