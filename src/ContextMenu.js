import React, { useState } from "react";
import { Modal, Platform, PlatformColor, Pressable, ScrollView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from "react-native";
import NativeContextMenu from "react-native-context-menu-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const menuWidth = 268;
const menuMargin = 12;
const menuOffset = 8;
const menuRowHeight = 48;
const dividerHeight = 9;

export function ContextMenu({ actions = [], children, dropdownMenuMode = false, onPress, ...nativeProps }) {
	if (Platform.OS === "ios") {
		return (
			<NativeContextMenu
				{...nativeProps}
				actions={actions}
				dropdownMenuMode={dropdownMenuMode}
				onPress={onPress}
			>
				{children}
			</NativeContextMenu>
		);
	}

	return (
		<AndroidContextMenu
			actions={actions}
			dropdownMenuMode={dropdownMenuMode}
			onPress={onPress}
		>
			{children}
		</AndroidContextMenu>
	);
}

function AndroidContextMenu({ actions, children, dropdownMenuMode, onPress }) {
	const is_dark = (useColorScheme() == "dark");
	const insets = useSafeAreaInsets();
	const windowSize = useWindowDimensions();
	const anchorRef = React.useRef(null);
	const [ isVisible, setIsVisible ] = useState(false);
	const [ menuPath, setMenuPath ] = useState([]);
	const [ origin, setOrigin ] = useState({ x: menuMargin, y: menuMargin });
	const [ measuredMenuHeight, setMeasuredMenuHeight ] = useState(null);
	const currentMenu = menuPath.length > 0 ? menuPath[menuPath.length - 1] : null;
	const currentActions = currentMenu?.actions || actions;
	const paneWidth = Math.min(menuWidth, windowSize.width - (menuMargin * 2));
	const maximumPaneHeight = Math.max(menuRowHeight, windowSize.height - insets.top - insets.bottom - (menuMargin * 2));
	const estimatedPaneHeight = estimatedMenuHeight(currentActions, currentMenu != null, maximumPaneHeight);
	const paneHeight = Math.min(measuredMenuHeight || estimatedPaneHeight, maximumPaneHeight);
	const panePosition = menuPosition(origin, paneWidth, paneHeight, windowSize, insets);
	const colors = menuColors(is_dark);

	function showMenu(event) {
		const page_x = event?.nativeEvent?.pageX;
		const page_y = event?.nativeEvent?.pageY;

		if (Number.isFinite(page_x) && Number.isFinite(page_y)) {
			openMenuAt(page_x, page_y);
			return;
		}

		anchorRef.current?.measureInWindow((x, y, width, height) => {
			openMenuAt(x + (width / 2), y + (height / 2));
		});
	}

	function openMenuAt(x, y) {
		setOrigin({ x: x, y: y });
		setMenuPath([]);
		setMeasuredMenuHeight(null);
		setIsVisible(true);
	}

	function dismissMenu() {
		setIsVisible(false);
		setMenuPath([]);
		setMeasuredMenuHeight(null);
	}

	function selectAction(action, index) {
		if (action.disabled || isDivider(action)) {
			return;
		}

		if (Array.isArray(action.actions) && action.actions.length > 0) {
			setMenuPath(current_path => [ ...current_path, action ]);
			setMeasuredMenuHeight(null);
			return;
		}

		dismissMenu();
		onPress?.({
			nativeEvent: {
				name: action.title,
				index: index
			}
		});
	}

	function showPreviousMenu() {
		setMenuPath(current_path => current_path.slice(0, -1));
		setMeasuredMenuHeight(null);
	}

	function renderAction(action, index) {
		if (isDivider(action)) {
			return (
				<View key={action.id || `divider-${index}`} style={menuStyles.dividerContainer}>
					<View style={[ menuStyles.divider, { backgroundColor: colors.divider } ]} />
				</View>
			);
		}

		const has_children = Array.isArray(action.actions) && action.actions.length > 0;
		return (
			<Pressable
				accessibilityRole="button"
				disabled={action.disabled}
				key={action.id || action.title || index}
				onPress={() => selectAction(action, index)}
				style={({ pressed }) => [
					menuStyles.row,
					pressed && !action.disabled ? { backgroundColor: colors.pressed } : null
				]}
			>
				<Text
					numberOfLines={1}
					style={[
						menuStyles.rowTitle,
						{ color: action.disabled ? colors.disabledText : colors.text }
					]}
				>
					{action.title}
				</Text>
				{has_children ? (
					<Text style={[ menuStyles.chevron, { color: colors.secondaryText } ]}>›</Text>
				) : null}
			</Pressable>
		);
	}

	let trigger;
	if (dropdownMenuMode) {
		trigger = (
			<Pressable onPress={showMenu}>
				{children}
			</Pressable>
		);
	}
	else if (React.isValidElement(children)) {
		const childOnLongPress = children.props.onLongPress;
		trigger = React.cloneElement(children, {
			onLongPress: event => {
				childOnLongPress?.(event);
				showMenu(event);
			}
		});
	}
	else {
		trigger = (
			<Pressable onLongPress={showMenu}>
				{children}
			</Pressable>
		);
	}

	return (
		<View collapsable={false} ref={anchorRef}>
			{trigger}
			<Modal
				animationType="fade"
				onRequestClose={dismissMenu}
				statusBarTranslucent={true}
				transparent={true}
				visible={isVisible}
			>
				<View style={menuStyles.overlay}>
					<Pressable accessibilityLabel="close menu" onPress={dismissMenu} style={StyleSheet.absoluteFill} />
					<View
						accessibilityViewIsModal={true}
						onLayout={event => {
							const height = event.nativeEvent.layout.height;
							if (height != measuredMenuHeight) {
								setMeasuredMenuHeight(height);
							}
						}}
						style={[
							menuStyles.pane,
							{
								backgroundColor: colors.background,
								borderColor: colors.border,
								left: panePosition.left,
								maxHeight: maximumPaneHeight,
								top: panePosition.top,
								width: paneWidth
							}
						]}
					>
						{currentMenu != null ? (
							<>
								<Pressable
									accessibilityLabel="back"
									accessibilityRole="button"
									onPress={showPreviousMenu}
									style={({ pressed }) => [
										menuStyles.row,
										pressed ? { backgroundColor: colors.pressed } : null
									]}
								>
									<Text style={[ menuStyles.backChevron, { color: colors.secondaryText } ]}>‹</Text>
									<Text numberOfLines={1} style={[ menuStyles.submenuTitle, { color: colors.text } ]}>{currentMenu.title}</Text>
								</Pressable>
								<View style={[ menuStyles.headerDivider, { backgroundColor: colors.divider } ]} />
							</>
						) : null}
						<ScrollView bounces={false} showsVerticalScrollIndicator={false}>
							{currentActions.map(renderAction)}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
}

function estimatedMenuHeight(actions, includesHeader, maximumHeight) {
	const content_height = actions.reduce((height, action) => {
		return height + (isDivider(action) ? dividerHeight : menuRowHeight);
	}, includesHeader ? menuRowHeight + StyleSheet.hairlineWidth : 0);
	return Math.min(content_height, maximumHeight);
}

function menuPosition(origin, width, height, windowSize, insets) {
	const minimum_top = insets.top + menuMargin;
	const maximum_top = windowSize.height - insets.bottom - height - menuMargin;
	const preferred_top = origin.y + menuOffset + height <= windowSize.height - insets.bottom - menuMargin ? origin.y + menuOffset : origin.y - height - menuOffset;

	return {
		left: Math.round(Math.max(menuMargin, (windowSize.width - width) / 2)),
		top: Math.max(minimum_top, Math.min(preferred_top, maximum_top))
	};
}

function isDivider(action) {
	return action?.separator === true || action?.id === "separator";
}

function menuColors(isDark) {
	if (isDark) {
		return {
			background: PlatformColor("?attr/colorBackgroundFloating"),
			border: "#35383E",
			disabledText: "#777B83",
			divider: "#41444B",
			pressed: PlatformColor("?attr/colorControlHighlight"),
			secondaryText: "#B4B7BE",
			text: "#F5F5F5"
		};
	}

	return {
		background: PlatformColor("?attr/colorBackgroundFloating"),
		border: "#E2E2E4",
		disabledText: "#A0A0A5",
		divider: "#D7D7DA",
		pressed: PlatformColor("?attr/colorControlHighlight"),
		secondaryText: "#6D6D72",
		text: "#171719"
	};
}

const menuStyles = StyleSheet.create({
	overlay: {
		flex: 1
	},
	pane: {
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		elevation: 14,
		overflow: "hidden",
		position: "absolute",
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.18,
		shadowRadius: 14
	},
	row: {
		alignItems: "center",
		flexDirection: "row",
		minHeight: menuRowHeight,
		paddingHorizontal: 17
	},
	rowTitle: {
		flex: 1,
		fontSize: 16
	},
	chevron: {
		fontSize: 25,
		lineHeight: 27,
		marginLeft: 12,
		marginTop: -2
	},
	backChevron: {
		fontSize: 25,
		lineHeight: 27,
		marginRight: 9,
		marginTop: -2
	},
	submenuTitle: {
		flex: 1,
		fontSize: 16,
		fontWeight: "600"
	},
	headerDivider: {
		height: StyleSheet.hairlineWidth
	},
	dividerContainer: {
		justifyContent: "center",
		height: dividerHeight,
		paddingHorizontal: 13
	},
	divider: {
		height: StyleSheet.hairlineWidth
	}
});
