import React from "react";
import { Platform, Pressable, Text } from "react-native";
import { Icon } from "../Icon";
import { BookDetailsScreen } from "../screens/BookDetailsScreen";
import { OpenEditionsScreen } from "../screens/OpenEditionsScreen";
import { OpenDetailsScreen } from "../screens/OpenDetailsScreen";
import { MovieDetailsScreen } from "../screens/MovieDetailsScreen";
import { TVSeasonsScreen } from "../screens/TVSeasonsScreen";
import { TVEpisodesScreen } from "../screens/TVEpisodesScreen";
import { TVEpisodeDetailsScreen } from "../screens/TVEpisodeDetailsScreen";
import { AuthorBooksScreen } from "../screens/AuthorBooksScreen";
import { NoteScreen } from "../screens/NoteScreen";
import { EditBookInfoScreen } from "../screens/EditBookInfoScreen";
import { AddBookInfoScreen } from "../screens/AddBookInfoScreen";
import { EditGoalScreen } from "../screens/EditGoalScreen";
import { OpenCoversScreen } from "../screens/OpenCoversScreen";
import { DateScreen } from "../screens/DateScreen";

// Shared by the phone's root stack and each iPad section stack. Keeping book
// sheets here lets popTo("Details") return to the same book after editing.
export function contentStackScreens(Stack, styles, is_dark) {
  return (
    <>
      <Stack.Group>
        <Stack.Screen
          name="Details"
          component={BookDetailsScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="back"
              >
                <Icon
                  name="navbar-back"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarBackIcon}
                />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable
                onPress={() => {
                  navigation.navigate("Post", { books: [] });
                }}
                hitSlop={10}
              >
                <Icon
                  name="publish"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarNewIcon}
                  accessibilityLabel="new post"
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="Editions"
          component={OpenEditionsScreen}
          options={({ navigation, route }) => ({
            title: "Editions",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="back"
              >
                <Icon
                  name="navbar-back"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarBackIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="OLDetails"
          component={OpenDetailsScreen}
          options={({ navigation, route }) => ({
            title: "Details",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="back"
              >
                <Icon
                  name="navbar-back"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarBackIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="MovieDetails"
          component={MovieDetailsScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="back"
              >
                <Icon
                  name="navbar-back"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarBackIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="TVSeasons"
          component={TVSeasonsScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="back"
              >
                <Icon
                  name="navbar-back"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarBackIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="TVEpisodes"
          component={TVEpisodesScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="back"
              >
                <Icon
                  name="navbar-back"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarBackIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="TVEpisodeDetails"
          component={TVEpisodeDetailsScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="back"
              >
                <Icon
                  name="navbar-back"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarBackIcon}
                />
              </Pressable>
            ),
          })}
        />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen
          name="AuthorBooks"
          component={AuthorBooksScreen}
          options={({ navigation, route }) => ({
            title: route.params.author,
            presentation: Platform.OS === "ios" ? "formSheet" : "modal",
            sheetAllowedDetents: [0.5, 0.9],
            sheetExpandsWhenScrolledToEdge: false,
            sheetInitialDetentIndex: 0,
            sheetGrabberVisible: true,
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <Icon
                  name="close"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarCloseIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="Note"
          component={NoteScreen}
          options={({ navigation, route }) => ({
            title: "Note",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <Icon
                  name="close"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarCloseIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="EditBookInfo"
          component={EditBookInfoScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <Icon
                  name="close"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarCloseIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="AddBookInfo"
          component={AddBookInfoScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <Icon
                  name="close"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarCloseIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="EditGoal"
          component={EditGoalScreen}
          options={({ navigation, route }) => ({
            title: "",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <Icon
                  name="close"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarCloseIcon}
                />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable
                onPress={() => {
                  navigation.navigate("Post", { books: [] });
                }}
                hitSlop={10}
              >
                <Icon
                  name="publish"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarNewIcon}
                  accessibilityLabel="new post"
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="Covers"
          component={OpenCoversScreen}
          options={({ navigation, route }) => ({
            title: "Covers",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <Icon
                  name="close"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarCloseIcon}
                />
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="DatePicker"
          component={DateScreen}
          options={({ navigation, route }) => ({
            title: "Finished Date",
            headerLeft: () => (
              <Pressable
                onPress={() => {
                  navigation.goBack();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="close"
              >
                <Icon
                  name="close"
                  color={is_dark ? "#FFFFFF" : "#000000"}
                  size={18}
                  style={styles.navbarCloseIcon}
                />
              </Pressable>
            ),
            headerRight: () => (
              <Pressable onPress={() => {}}>
                <Text style={styles.navbarSubmit}>Update</Text>
              </Pressable>
            ),
          })}
        />
      </Stack.Group>
    </>
  );
}
