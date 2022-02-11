import React, { useState } from "react";
import type { Node } from "react";
import { useColorScheme, Pressable, Button, Image, FlatList, StyleSheet, Text, SafeAreaView, View, ScrollView } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MenuView } from "@react-native-menu/menu";

function HomeScreen({ navigation }) {
  const [ books, setBooks ] = useState();
  let auth_token = "";
  var bookshelves = [];
  var current_bookshelf = { id: 0, title: "" };
  
  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      onFocus(navigation);
    });
    return unsubscribe;
  }, [navigation]);
  
  function onFocus(navigation) {
    loadBookshelves(navigation)
  }
  
  function loadBooks(bookshelf_id, handler = function() {}) {
    var options = {
      headers: {
        "Authorization": "Bearer " + auth_token
      }
    };
    
    for (let shelf of bookshelves) {
      if (shelf.id == bookshelf_id) {
        current_bookshelf = shelf;
      }
    }
    
    fetch("https://micro.blog/books/bookshelves/" + bookshelf_id, options).then(response => response.json()).then(data => {
      var new_items = [];
      for (let item of data.items) {
        var author_name = "";
        if (item.authors.length > 0) {
          author_name = item.authors[0].name;
        }
        new_items.push({
          id: item.id,
          title: item.title,
          image: item.image,
          author: author_name
        });
      }
      setBooks(new_items);
      handler();
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

      bookshelves = new_items;
      if (current_bookshelf.id == 0) {
        let first_bookshelf = new_items[0];
        current_bookshelf = first_bookshelf;
      }
      loadBooks(current_bookshelf.id);
      setupBookshelves(navigation, new_items, current_bookshelf.title);
    });		
  }

  function setupBookshelves(navigation, items, currentTitle) {
    navigation.setOptions({
      headerRight: () => (
        <MenuView
          onPressAction = {({ nativeEvent }) => {
            let shelf_id = nativeEvent.event;
            loadBooks(shelf_id, function() {
              setupBookshelves(navigation, bookshelves, current_bookshelf.title);
            });
          }}
          actions = {items}
          >
          <View style={styles.navbarBookshelf}>
            <Image style={styles.navbarBookshelfIcon} source={require("./images/books.png")} />
            <Text style={styles.navbarBookshelfTitle}>{currentTitle}</Text>
          </View>
        </MenuView>
      )
    });
  }

  function onShowBookPressed(item) {
    navigation.navigate("Details", item);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data = {books}
        renderItem = { ({item}) => 
          <Pressable onPress={() => { onShowBookPressed(item) }}>
            <View style={styles.item}>
              <Image style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
              <View style={styles.bookItem}>
                <Text style={styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
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
      <View style={styles.bookDetails}>
        <Image style={styles.bookDetailsCover} source={{ uri: image.replace("http://", "https://") }} />
        <Text style={styles.bookDetailsTitle}>{title}</Text>
        <Text style={styles.bookDetailsAuthor}>{author}</Text>
      </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 10
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12    
  },
  navbarBookshelf: {
    flexDirection: "row",
    marginTop: 4
  },
  navbarBookshelfIcon: {
    width: 25,
    height: 25,
    tintColor: "#337AB7"
  },
  navbarBookshelfTitle: {
    paddingTop: 3,
    paddingLeft: 5,
    color: "#337AB7"
  },
  item: {
    flexDirection: "row",
    height: 90,
    marginLeft: 20,
    marginRight: 20,
    paddingBottom: 10
  },
  bookItem: {
    flex: 1
  },
  bookTitle: {
    marginTop: 8,
    paddingLeft: 7
  },
  bookAuthor: {
    paddingTop: 4,
    paddingLeft: 7,
    color: "#777777"
  },
  bookCover: {
    width: 50,
    height: 70
  },
  bookDetails: {
    flex: 1,
    alignItems: "center"
  },
  bookDetailsCover: {
    width: 200,
    height: 200,
    resizeMode: "contain"
  },
  bookDetailsTitle: {
    marginTop: 5
  },
  bookDetailsAuthor: {
    marginTop: 5
  },
  navbarNewIcon: {
    width: 25,
    height: 25,
    tintColor: "#337AB7"
  },
  navbarBackIcon: {
    width: 19,
    height: 25,
    tintColor: "#337AB7"
  }
});

export default App;
