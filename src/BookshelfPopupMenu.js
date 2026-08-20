import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Animated, BackHandler, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const BOOKSHELF_MENU_ANIMATION_DURATION = 180;
export const BOOKSHELF_MENU_ROW_HEIGHT = 48;

const menuWidth = 268;
const menuMargin = 12;
const menuTopMargin = 5;
const menuOffset = 6;
const menuDismissAnimationDuration = 120;
const dragActivationDelay = 160;

export function bookshelfMenuCornerRadius(platformOS = Platform.OS, platformVersion = Platform.Version) {
	const major_version = Number.parseInt(String(platformVersion).split(".")[0], 10);
	return platformOS == "ios" && major_version >= 26 ? 26 : 12;
}

export function bookshelfMenuFrameForAnchor(anchor, bookshelfCount, containerSize, bottomInset = 0) {
	const available_width = Math.max(0, containerSize.width - (menuMargin * 2));
	const available_bottom = containerSize.height - bottomInset;
	const available_height = Math.max(0, available_bottom - (menuMargin * 2));
	const width = Math.min(menuWidth, available_width);
	const height = Math.min(bookshelfCount * BOOKSHELF_MENU_ROW_HEIGHT, available_height);
	const maximum_left = Math.max(menuMargin, containerSize.width - width - menuMargin);
	const centered_left = anchor.x + (anchor.width / 2) - (width / 2);
	const left = Math.max(menuMargin, Math.min(centered_left, maximum_left));
	const maximum_top = Math.max(menuMargin, available_bottom - height - menuMargin);
	const below_top = Math.max(menuTopMargin, anchor.y + anchor.height + menuOffset);
	const above_top = anchor.y - height - menuOffset;
	const can_fit_below = below_top + height <= available_bottom - menuMargin;
	const can_fit_above = above_top >= menuTopMargin;
	let top = below_top;

	if (!can_fit_below && can_fit_above) {
		top = above_top;
	}
	else {
		top = Math.min(below_top, maximum_top);
	}

	return {
		height: Math.round(height),
		left: Math.round(left),
		top: Math.round(Math.max(menuTopMargin, top)),
		width: Math.round(width)
	};
}

export function bookshelfIndexAtPoint(point, menuFrame, bookshelfCount, scrollOffset = 0) {
	if (!point || !menuFrame || bookshelfCount <= 0) {
		return null;
	}

	const is_inside = point.x >= menuFrame.left &&
		point.x < menuFrame.left + menuFrame.width &&
		point.y >= menuFrame.top &&
		point.y < menuFrame.top + menuFrame.height;
	if (!is_inside) {
		return null;
	}

	const index = Math.floor((point.y - menuFrame.top + scrollOffset) / BOOKSHELF_MENU_ROW_HEIGHT);
	return index >= 0 && index < bookshelfCount ? index : null;
}

export function BookshelfPopupMenuTrigger({ accessibilityLabel, children, menuRef }) {
	const anchorRef = useRef(null);
	const dragSessionRef = useRef({
		active: false,
		began: false,
		ended: false,
		id: 0,
		latestPoint: null
	});

	function pointFromGesture(event) {
		return { x: event.absoluteX, y: event.absoluteY };
	}

	function measureAnchor(handler) {
		anchorRef.current?.measureInWindow((x, y, width, height) => {
			handler({ x: x, y: y, width: width, height: height });
		});
	}

	function openForTap() {
		measureAnchor(anchor => {
			menuRef.current?.open(anchor);
		});
	}

	function beginDrag(event) {
		const session = dragSessionRef.current;
		session.id += 1;
		session.active = true;
		session.began = false;
		session.ended = false;
		session.latestPoint = pointFromGesture(event);
		const session_id = session.id;

		measureAnchor(anchor => {
			const current_session = dragSessionRef.current;
			if (current_session.id != session_id) {
				return;
			}

			current_session.began = true;
			menuRef.current?.beginDrag(anchor, current_session.latestPoint);
			if (current_session.ended) {
				menuRef.current?.endDrag(current_session.latestPoint);
			}
		});
	}

	function updateDrag(event) {
		const session = dragSessionRef.current;
		if (!session.active) {
			return;
		}

		session.latestPoint = pointFromGesture(event);
		if (session.began) {
			menuRef.current?.updateDrag(session.latestPoint);
		}
	}

	function endDrag(event) {
		const session = dragSessionRef.current;
		if (!session.active) {
			return;
		}

		session.latestPoint = pointFromGesture(event);
		session.ended = true;
		session.active = false;
		if (session.began) {
			menuRef.current?.endDrag(session.latestPoint);
		}
	}

	function finalizeDrag(success) {
		const session = dragSessionRef.current;
		if (!success && session.active) {
			session.id += 1;
			session.active = false;
			session.began = false;
			session.ended = false;
			menuRef.current?.cancelDrag();
		}
	}

	const popupGesture = useMemo(() => {
		const drag = Gesture.Pan()
			.activateAfterLongPress(dragActivationDelay)
			.shouldCancelWhenOutside(false)
			.onStart(beginDrag)
			.onUpdate(updateDrag)
			.onEnd(endDrag)
			.onFinalize((event, success) => finalizeDrag(success))
			.runOnJS(true);
		const tap = Gesture.Tap()
			.onEnd((event, success) => {
				if (success) {
					openForTap();
				}
			})
			.runOnJS(true);

		return Gesture.Race(drag, tap);
	}, [menuRef]);

	return (
		<GestureDetector gesture={popupGesture}>
			<View
				accessible={true}
				accessibilityActions={[{ name: "activate" }]}
				accessibilityHint="Shows your bookshelves"
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="button"
				collapsable={false}
				hitSlop={8}
				onAccessibilityAction={event => {
					if (event.nativeEvent.actionName == "activate") {
						openForTap();
					}
				}}
				onAccessibilityTap={openForTap}
				ref={anchorRef}
				testID="bookshelf-menu-trigger"
			>
				{children}
			</View>
		</GestureDetector>
	);
}

export const BookshelfPopupMenu = forwardRef(function BookshelfPopupMenu({ bookshelves = [], onSelect, selectedBookshelfID }, ref) {
	const is_dark = useColorScheme() == "dark";
	const insets = useSafeAreaInsets();
	const animation = useRef(new Animated.Value(0)).current;
	const containerRef = useRef(null);
	const scrollViewRef = useRef(null);
	const bottomInsetRef = useRef(insets.bottom);
	const bookshelvesRef = useRef(bookshelves);
	const onSelectRef = useRef(onSelect);
	const selectedBookshelfIDRef = useRef(selectedBookshelfID);
	const snapshotRef = useRef([]);
	const menuFrameRef = useRef(null);
	const scrollOffsetRef = useRef(0);
	const highlightedIndexRef = useRef(null);
	const latestDragPointRef = useRef(null);
	const dragActiveRef = useRef(false);
	const dragEndedBeforeOpenRef = useRef(false);
	const openingRequestRef = useRef(0);
	const isEnabledRef = useRef(true);
	const isVisibleRef = useRef(false);
	const isClosingRef = useRef(false);
	const [ isVisible, setIsVisible ] = useState(false);
	const [ menuBookshelves, setMenuBookshelves ] = useState([]);
	const [ menuFrame, setMenuFrame ] = useState(null);
	const [ highlightedIndex, setHighlightedIndex ] = useState(null);
	const colors = bookshelfMenuColors(is_dark);
	const corner_radius = bookshelfMenuCornerRadius();

	bookshelvesRef.current = bookshelves;
	bottomInsetRef.current = insets.bottom;
	onSelectRef.current = onSelect;
	selectedBookshelfIDRef.current = selectedBookshelfID;

	function setHighlight(index) {
		if (highlightedIndexRef.current == index) {
			return;
		}

		highlightedIndexRef.current = index;
		setHighlightedIndex(index);
	}

	function updateHighlight(point) {
		latestDragPointRef.current = point;
		const index = bookshelfIndexAtPoint(
			point,
			menuFrameRef.current,
			snapshotRef.current.length,
			scrollOffsetRef.current
		);
		setHighlight(index);
		return index;
	}

	function finishDismiss() {
		isVisibleRef.current = false;
		isClosingRef.current = false;
		menuFrameRef.current = null;
		snapshotRef.current = [];
		scrollOffsetRef.current = 0;
		setHighlight(null);
		setIsVisible(false);
		setMenuFrame(null);
		setMenuBookshelves([]);
	}

	function dismissMenu(animated = true) {
		openingRequestRef.current += 1;
		dragActiveRef.current = false;
		dragEndedBeforeOpenRef.current = false;
		setHighlight(null);
		if (!isVisibleRef.current || isClosingRef.current) {
			return;
		}

		if (!animated) {
			animation.stopAnimation();
			finishDismiss();
			return;
		}

		isClosingRef.current = true;
		Animated.timing(animation, {
			duration: menuDismissAnimationDuration,
			easing: Easing.in(Easing.quad),
			toValue: 0,
			useNativeDriver: true
		}).start(finishDismiss);
	}

	function selectBookshelfAtIndex(index) {
		const bookshelf = snapshotRef.current[index];
		if (bookshelf == undefined || isClosingRef.current) {
			return;
		}

		dismissMenu();
		onSelectRef.current?.(bookshelf);
	}

	function completeDrag(point) {
		if (!dragActiveRef.current) {
			return;
		}

		const index = updateHighlight(point);
		dragActiveRef.current = false;
		dragEndedBeforeOpenRef.current = false;
		if (index != null) {
			selectBookshelfAtIndex(index);
		}
		else {
			setHighlight(null);
		}
	}

	function presentMenu(anchor, isDrag, point = null) {
		if (!isEnabledRef.current || bookshelvesRef.current.length == 0 || isClosingRef.current) {
			return;
		}

		if (isVisibleRef.current) {
			if (isDrag) {
				dragActiveRef.current = true;
				dragEndedBeforeOpenRef.current = false;
				updateHighlight(point);
			}
			else {
				dismissMenu();
			}
			return;
		}

		const snapshot = bookshelvesRef.current.slice();
		const request_id = openingRequestRef.current + 1;
		openingRequestRef.current = request_id;
		snapshotRef.current = snapshot;
		latestDragPointRef.current = point;
		dragActiveRef.current = isDrag;
		dragEndedBeforeOpenRef.current = false;
		containerRef.current?.measureInWindow((x, y, width, height) => {
			if (openingRequestRef.current != request_id) {
				return;
			}

			const local_anchor = {
				height: anchor.height,
				width: anchor.width,
				x: anchor.x - x,
				y: anchor.y - y
			};
			const local_frame = bookshelfMenuFrameForAnchor(local_anchor, snapshot.length, { width: width, height: height }, bottomInsetRef.current);
			const absolute_frame = {
				height: local_frame.height,
				left: x + local_frame.left,
				top: y + local_frame.top,
				width: local_frame.width
			};

			menuFrameRef.current = absolute_frame;
			scrollOffsetRef.current = 0;
			setMenuBookshelves(snapshot);
			setMenuFrame(local_frame);
			setHighlight(null);
			animation.stopAnimation();
			animation.setValue(0);
			isVisibleRef.current = true;
			setIsVisible(true);

			if (isDrag) {
				updateHighlight(latestDragPointRef.current);
				if (dragEndedBeforeOpenRef.current) {
					completeDrag(latestDragPointRef.current);
				}
			}
		});
	}

	useImperativeHandle(ref, () => ({
		beginDrag(anchor, point) {
			presentMenu(anchor, true, point);
		},
		cancelDrag() {
			if (!dragActiveRef.current) {
				return;
			}

			dragActiveRef.current = false;
			dragEndedBeforeOpenRef.current = false;
			setHighlight(null);
		},
		dismiss(animated = true) {
			dismissMenu(animated);
		},
		endDrag(point) {
			latestDragPointRef.current = point;
			if (menuFrameRef.current == null || !isVisibleRef.current) {
				dragEndedBeforeOpenRef.current = true;
				return;
			}

			completeDrag(point);
		},
		open(anchor) {
			presentMenu(anchor, false);
		},
		setEnabled(enabled) {
			isEnabledRef.current = enabled;
			if (!enabled) {
				dismissMenu(false);
			}
		},
		updateDrag(point) {
			if (dragActiveRef.current && menuFrameRef.current != null) {
				updateHighlight(point);
			}
		}
	}), []);

	useEffect(() => {
		if (!isVisible) {
			return;
		}

		scrollViewRef.current?.scrollTo({ animated: false, y: 0 });
		Animated.timing(animation, {
			duration: BOOKSHELF_MENU_ANIMATION_DURATION,
			easing: Easing.out(Easing.cubic),
			toValue: 1,
			useNativeDriver: true
		}).start();
	}, [animation, isVisible]);

	useEffect(() => {
		if (!isVisible) {
			return;
		}

		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			dismissMenu();
			return true;
		});
		return () => subscription.remove();
	}, [isVisible]);

	useEffect(() => {
		return () => {
			openingRequestRef.current += 1;
			animation.stopAnimation();
		};
	}, [animation]);

	return (
		<View
			accessibilityViewIsModal={isVisible}
			collapsable={false}
			onAccessibilityEscape={() => dismissMenu()}
			pointerEvents={isVisible ? "auto" : "none"}
			ref={containerRef}
			style={menuStyles.layer}
			testID="bookshelf-menu-layer"
		>
			{isVisible && menuFrame != null ? (
				<>
					<Pressable accessibilityLabel="close bookshelf menu" onPress={() => dismissMenu()} style={StyleSheet.absoluteFill} testID="bookshelf-menu-overlay" />
					<Animated.View
						style={[
							menuStyles.pane,
							{
								backgroundColor: colors.background,
								borderRadius: corner_radius,
								height: menuFrame.height,
								left: menuFrame.left,
								opacity: animation,
								top: menuFrame.top,
								width: menuFrame.width
							}
						]}
						testID="bookshelf-menu-pane"
					>
						<View style={[ menuStyles.surface, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: corner_radius } ]}>
							<ScrollView
								bounces={false}
								keyboardShouldPersistTaps="handled"
								onScroll={event => {
									scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
								}}
								ref={scrollViewRef}
								scrollEventThrottle={16}
								showsVerticalScrollIndicator={false}
							>
								{menuBookshelves.map((bookshelf, index) => {
									const is_selected = String(bookshelf.id) == String(selectedBookshelfIDRef.current);
									const is_highlighted = highlightedIndex == index;
									return (
										<Pressable
											accessibilityRole="button"
											accessibilityState={{ selected: is_selected }}
											key={bookshelf.id}
											onPress={() => selectBookshelfAtIndex(index)}
											style={({ pressed }) => [
												menuStyles.row,
												index < menuBookshelves.length - 1 ? { borderBottomColor: colors.divider } : { borderBottomWidth: 0 },
												(pressed || is_highlighted) ? { backgroundColor: colors.highlighted } : null
											]}
											testID={`bookshelf-menu-row-${bookshelf.id}`}
										>
											<View style={menuStyles.checkSlot}>
												{is_selected ? <Text style={[ menuStyles.checkmark, { color: colors.checkmark } ]}>✓</Text> : null}
											</View>
											<Text numberOfLines={1} style={[ menuStyles.title, { color: colors.text } ]}>{bookshelf.title}</Text>
										</Pressable>
									);
								})}
							</ScrollView>
						</View>
					</Animated.View>
				</>
			) : null}
		</View>
	);
});

function bookshelfMenuColors(isDark) {
	if (isDark) {
		return {
			background: "#2C3440",
			border: "#444B57",
			checkmark: "#FFB45A",
			divider: "#444B57",
			highlighted: "rgba(255, 255, 255, 0.10)",
			text: "#FFFFFF"
		};
	}

	return {
		background: "#FFFFFF",
		border: "#DEDEE2",
		checkmark: "#C85F00",
		divider: "#E5E5E8",
		highlighted: "rgba(0, 0, 0, 0.07)",
		text: "#171719"
	};
}

const menuStyles = StyleSheet.create({
	layer: {
		...StyleSheet.absoluteFillObject,
		elevation: 100,
		zIndex: 100
	},
	pane: {
		elevation: 14,
		position: "absolute",
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.20,
		shadowRadius: 14
	},
	surface: {
		borderWidth: StyleSheet.hairlineWidth,
		flex: 1,
		overflow: "hidden"
	},
	row: {
		alignItems: "center",
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexDirection: "row",
		height: BOOKSHELF_MENU_ROW_HEIGHT,
		paddingRight: 17
	},
	checkSlot: {
		alignItems: "center",
		justifyContent: "center",
		width: 42
	},
	checkmark: {
		fontSize: 17,
		fontWeight: "600"
	},
	title: {
		flex: 1,
		fontSize: 16
	}
});
