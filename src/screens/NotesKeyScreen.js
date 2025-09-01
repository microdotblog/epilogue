import React, { useState } from "react";
import { TextInput, Pressable, Text, View, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { keys } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";

export function NotesKeyScreen({ navigation }) {
  const styles = useEpilogueStyle();
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
    if (!newSecretKey.includes("mkey")) {
      Alert.alert("This key does not appear to be a valid secret key.");
    }
    else {
      epilogueStorage.set(keys.notesKey, newSecretKey).then(() => {
        navigation.goBack();
      });
    }
  }

  return (
    <View style={styles.blogListContainer}>
      <Text style={styles.notesKeyIntro}>Notes in Micro.blog are encrypted. To sync notes across devices, you will need to save a secret key so the notes can be decrypted later. If you lose your key, you will lose access to your notes too.</Text>
      <Text style={styles.notesKeyLabel}>Notes Secret Key:</Text>
      <TextInput
        style={[styles.signInInput, styles.micropubURL, { height: 120, textAlignVertical: "top", marginRight: 15 }]}
        value={secretKey}
        onChangeText={setSecretKey}
        placeholder="Enter your notes key"
        autoCapitalize="none"
        autoCorrect={false}
        multiline={true}
        numberOfLines={6}
      />
    </View>
  );
}

