import React, { Component, useState } from "react";
import { View, Text, Platform } from "react-native";
import AndroidIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SFSymbol } from "./SFSymbols";

// For Icons, we use SF Symbols on iOS and Google's Material Design Icons on
// Android. The IconNames variable below takes a generic name and maps to the
// name of the icon on each platform.
//
// To find SF Symbols, you can use the SF Symbols browser on the App Store.
// To find Material icons, use the browser here: https://materialdesignicons.com

const IconNames = {
  "publish": { ios: "square.and.pencil", android: "pencil" },
  "navbar-back": { ios: "chevron.left", android: "arrow-left" },
  "close": { ios: "xmark", android: "close" },
  "bookshelf": { ios: "books.vertical", android: "bookshelf" },
  "bookshelves": { ios: "books.vertical", android: "bookshelf" },
  "discover": { ios: "magnifyingglass", android: "magnify" },
  "goals": { ios: "calendar", android: "calendar" },
  "popup-triangle": { ios: "chevron.down", android: "chevron-down" },
  "trash": { ios: "trash", android: "trash-can" },
  "book": { ios: "book.closed", android: "book" },
  "openlibrary": { ios: "building.columns", android: "archive" },
  "photo": { ios: "photo", android: "image" }
}

export const Icon = (props) => {
  const name = IconNames[props.name]?.[Platform.OS];
  if (!name) {
    throw new Error("Icon name not found in IconNames map. You need to define the icon names for iOS and Android in the Icon component file.");
  }

  const style = {
    width: props.size,
    height: props.size,
    textAlignVertical: "center",
    textAlign: "center",
    ...props.style,
  };

  if (Platform.OS === 'android') {
    return <AndroidIcon {...props} size={props.size + 2} name={name} style={style} />
  }
  if (Platform.OS === 'ios') {
    return <SFSymbol {...props} name={name} style={style} />
  }
};
