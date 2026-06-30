import "react-native-gesture-handler/jestSetup";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-fs", () => ({
  CachesDirectoryPath: "/tmp/cache",
  TemporaryDirectoryPath: "/tmp",
  copyFile: jest.fn(() => Promise.resolve()),
  downloadFile: jest.fn(() => ({ promise: Promise.resolve({ statusCode: 200 }) })),
  mkdir: jest.fn(() => Promise.resolve()),
  readDir: jest.fn(() => Promise.resolve([])),
  readFile: jest.fn(() => Promise.resolve("{}")),
  stat: jest.fn(() => Promise.reject(new Error("Not found"))),
  unlink: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve())
}));

jest.mock("@react-native-clipboard/clipboard", () => ({
  getString: jest.fn(() => Promise.resolve("")),
  setString: jest.fn()
}));

jest.mock("@invertase/react-native-apple-authentication", () => {
  const React = require("react");
  const { Pressable } = require("react-native");

  return {
    AppleButton: Object.assign(
      props => React.createElement(Pressable, props),
      {
        Style: { BLACK: "BLACK", WHITE: "WHITE" },
        Type: { SIGN_IN: "SIGN_IN" }
      }
    ),
    appleAuth: {
      Operation: { LOGIN: "LOGIN" },
      Scope: { EMAIL: "EMAIL", FULL_NAME: "FULL_NAME" },
      performRequest: jest.fn(() => Promise.resolve({})),
      getCredentialStateForUser: jest.fn(() => Promise.resolve("AUTHORIZED")),
      onCredentialRevoked: jest.fn(() => jest.fn())
    }
  };
});

jest.mock("@react-native-menu/menu", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    MenuView: ({ children, ...props }) => React.createElement(View, props, children)
  };
});

jest.mock("react-native-context-menu-view", () => {
  const React = require("react");
  const { View } = require("react-native");

  return ({ children, ...props }) => React.createElement(View, props, children);
});

jest.mock("react-native-fast-image", () => {
  const React = require("react");
  const { Image } = require("react-native");

  return React.forwardRef((props, ref) => React.createElement(Image, { ...props, ref }));
});

jest.mock("react-native-inappbrowser-reborn", () => ({
  InAppBrowser: {
    isAvailable: jest.fn(() => Promise.resolve(false)),
    open: jest.fn(() => Promise.resolve())
  }
}));

jest.mock("react-native-navigation-bar-color", () => jest.fn(() => Promise.resolve()));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "2.4",
  nativeBuildVersion: "131"
}));

jest.mock("react-native-sfsymbols", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SFSymbol: props => React.createElement(View, props)
  };
});
