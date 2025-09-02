import React, { useState } from "react";
import { TextInput, Pressable, Text, View } from "react-native";

import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import epilogueStorage from "../Storage";
import { keys } from "../Constants";
import { Note } from "../models/Note";
import CryptoUtils from '../utils/crypto';

export function NoteScreen({ route, navigation }) {
  const styles = useEpilogueStyle();
  const initialText = route.params.note?.text ?? "";
  const isEditing = route.params.note != null;
  const isbn = route.params.isbn;
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

  async function onSubmit() {
    const secret_key = await epilogueStorage.get(keys.notesKey);
    const encrypted_text = await CryptoUtils.encrypt(text, secret_key);

    let form = new FormData();
    form.append("text", encrypted_text);
    form.append("is_encrypted", "1");
    form.append("attached_book_isbn", isbn);

    const note_id = route?.params?.note?.id;
    if (note_id != null) {
      form.append("id", note_id);
    }

    epilogueStorage.get(keys.authToken).then(auth_token => {
      const options = {
        method: "POST",
        body: form,
        headers: {
          "Authorization": "Bearer " + auth_token
        }
      };

      fetch("https://micro.blog/notes", options)
        .then(response => response.json())
        .then(data => {
          navigation.goBack();
        })
        .catch(err => {
          navigation.goBack();
        });
    });
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
        placeholder=""
        multiline={true}
        autoFocus={true}
      />
    </View>
  );
}
