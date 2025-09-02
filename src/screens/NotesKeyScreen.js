import React, { useState } from "react";
import { TextInput, Pressable, Text, View, Alert, useColorScheme } from "react-native";
import { InAppBrowser } from 'react-native-inappbrowser-reborn'
import { useFocusEffect } from "@react-navigation/native";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { Icon } from "../Icon";

export function NotesKeyScreen({ navigation }) {
  const styles = useEpilogueStyle();
  const is_dark = (useColorScheme() == "dark");
  const [secretKey, setSecretKey] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      onFocus();
      return () => {};
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => { onUnlockNotes(secretKey); }}>
          <Text style={styles.navbarSubmit}>Unlock Notes</Text>
        </Pressable>
      ),
    });
  }, [ navigation, secretKey ]);
  
  function onFocus() {
    // load saved key and set up the nav button
    epilogueStorage.get(keys.notesKey).then((value) => {
      if ((value != undefined) && (value.length > 0)) {
        setSecretKey(value);
      } else {
        setSecretKey("");
      }
    });
  }

  function onUnlockNotes(newSecretKey) {
    if (newSecretKey == "") {
      epilogueStorage.remove(keys.notesKey).then(() => {
        navigation.goBack();
      });
    }
    else {
      const key = newSecretKey.trim();
      if (!key.includes("mkey") || ((key.length != 64) && (key.length != 68))) {
        Alert.alert("This key does not appear to be a valid secret key.");
      }
      else {
        epilogueStorage.set(keys.notesKey, key).then(() => {
          navigation.goBack();
        });
      }
    }
  }
  
  async function onHelpPressed() {
    const url = "https://help.micro.blog/t/notes/2939";
    try {
      await InAppBrowser.open(url, { animated: true });
    }
    catch (e) {
    }
  }

  return (
    <View style={styles.blogListContainer}>
      <Text style={styles.notesKeyIntro}>Notes in Micro.blog are encrypted. To sync notes across devices, you will need to save a secret key so the notes can be decrypted later.</Text>
      <Text style={styles.notesKeyIntro}>Copy your secret key from Micro.blog on the web.</Text>
      <Text style={styles.notesKeyLabel}>Notes Secret Key:</Text>
      <TextInput
        style={[styles.signInInput, styles.micropubURL, { height: 120, textAlignVertical: "top", marginRight: 15 }]}
        value={secretKey}
        onChangeText={setSecretKey}
        placeholder="Enter your notes key"
        autoCapitalize="none"
        autoCorrect={false}
        multiline={true}
        numberOfLines={4}
      />
      <View style={{ alignSelf: "flex-start" }}>
        <Pressable style={[styles.plainButton, { flexDirection: "row", alignItems: "center", marginTop: 15 }]} onPress={() => { onHelpPressed(); }}>
          <Icon name="help" color={is_dark ? "#FFFFFF" : "#000000"} size={16} />
          <Text style={[styles.plainButtonTitle, { marginLeft: 6 }]} accessibilityLabel="view help article">Notes in Micro.blog</Text>
        </Pressable>
      </View>
    </View>
  );
}
