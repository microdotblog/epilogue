# Contributing to Epilogue

Thanks contributing to Epilogue!

Epilogue is a React Native application. To get started, you’ll need to follow these steps:

### General
1. You’ll need NodeJS. On a Mac, you can install it with Homebrew: `brew install node`.
2. For optimal reload performance, you’ll also need [Watchman](https://facebook.github.io/watchman/), which you can get with `brew install watchman`.
3. Epilogue prefers [Yarn](https://yarnpkg.com) over NPM for node dependencies. [Install Yarn](https://yarnpkg.com/getting-started/install), and then run `yarn install` to fetch dependencies.

### iOS
1. You’ll need [Xcode](https://developer.apple.com/xcode/). You can download it from the App Store. You also will need to have configured the Xcode Command Line tools. Make sure there’s one set in Preferences > Locations > Command Line Tools.
2. For iOS, Epilogue also uses [CocoaPods](https://cocoapods.org) to manage iOS dependencies. In the root directory, run `bundle install` to install Cocoapods. You’ll need the correct version of Ruby on your system, but it will prompt you with the version you need. From inside the iOS directory run `bundle exec pod install` to install the required dependencies.
3. To start the app in the iOS simulator, in the root directory, run `yarn ios`.

### Android
1. You’ll need a [JDK](https://openjdk.java.net): `brew install --cask adoptopenjdk/openjdk/adoptopenjdk11`
2. You’ll also need to download and install [Android Studio](https://developer.android.com/studio/index.html). Once you’ve downloaded it and moved it to your Applications folder, you’ll need to ensure that you run Studio to make it through the installation process. That will download a simulator.
3. React Native requires a specific version of the Android SDK. This requires some special configuration in Android Studio. [Instructions for how to configure and download the required version of the Android SDK are here.](https://reactnative.dev/docs/environment-setup)
4. Create a file in the `android` directory called `local.properties`. In that file paste: `sdk.dir = /Users/USERNAME/Library/Android/sdk` changing USERNAME to your system username. This file is .gitignored and will not be committed.
5. You need to generate a debug keystore. To do this, cd into `android/app` and run `keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000`. This will generate a `debug.keystore` file that is gitignored and will not be committed.
6. You’ll also need to open Android Studio and go to Tools > Device Manager to download a simulator.
7. To start the app in the Android simulator, in the root directory, run `yarn android`.

## Helpful Commands
* `yarn start`: General start for react-native
* `yarn ios`: Starts the iOS app in the simulator
* `yarn android`: Starts the Android app in the simulator
* `yarn test`: Runs tests
