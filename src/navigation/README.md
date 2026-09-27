# iPad navigation

On iPad, `TabletLayout` wraps the native tab navigator in a two-column
`UISplitViewController` using React Native Screens' experimental `Split` bridge.
Landscape windows at least 768 points wide show the sidebar and hide the tabs.
Portrait and narrower windows show only the secondary column with native tabs.
The navigators stay mounted across these changes, preserving each section's stack.

Each iPad section uses `SectionStack`. Detail screens and their editing sheets
are registered together in `ContentStackScreens`, so `popTo("Details")` stays in
the originating section. Profile, sign-in and compose remain on the app's root
stack. iPhone and Android keep the original root-stack/tab arrangement.

The split's secondary column uses native left/right safe-area insets: UIKit can
extend it beneath the sidebar even in tiled mode. Do not hard-code a sidebar
offset on individual screens.

## Native build requirement

`ios/Podfile` enables `RNS_GAMMA_ENABLED`. After installing dependencies with Bun,
run `pod install` in `ios` and rebuild the app; Metro reload alone is insufficient.
The versioned `react-native-screens` patch fixes delayed column initialization
when mounted inside a navigation screen, and hides empty wrapper navigation bars
when both split toggles are disabled. The nested stacks provide the actual bars.
Recheck these two fixes when upgrading React Native Screens.
