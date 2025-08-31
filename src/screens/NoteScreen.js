import React, { useState } from "react";
import { TextInput, Pressable, Text, View } from "react-native";

import { useEpilogueStyle } from "../hooks/useEpilogueStyle";

export function NoteScreen({ route, navigation }) {
  const styles = useEpilogueStyle();
  const initialText = route?.params?.note?.text ?? "";
  const isEditing = route?.params?.note != null;
  const [text, setText] = useState(initialText);

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => { onSubmit(); }}>
          <Text style={styles.navbarSubmit}>Save</Text>
        </Pressable>
      )
    });
  }, [navigation, isEditing, text]);

  function onSubmit() {
    navigation.goBack();
  }

  function onChangeText(t) {
    setText(t);
  }

  return (
    <View style={styles.postTextBox}>
      <TextInput
        style={styles.postTextInput}
        value={text}
        onChangeText={onChangeText}
        placeholder="Reading note text..."
        multiline={true}
        autoFocus={true}
      />
    </View>
  );
}

