import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { isBookISBN, normalizedISBN } from "./ISBN";
import { Book } from "./models/Book";
import { Icon } from "./Icon";

export function BookScanner({ onClose, onBook, onManualEntry }) {
	const [permission, requestPermission, getPermission] = useCameraPermissions();
	const [visible, setVisible] = useState(true);
	const [appState, setAppState] = useState(AppState.currentState);
	const [torch, setTorch] = useState(false);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [cameraError, setCameraError] = useState(false);
	const [isbn, setISBN] = useState("");
	const busy = useRef(false);
	const closed = useRef(false);
	const delivered = useRef(false);
	const askedPermission = useRef(false);
	const request = useRef(null);
	const pendingAction = useRef(null);

	useEffect(() => {
		closed.current = false;
		const subscription = AppState.addEventListener("change", state => {
			setAppState(state);
			if (state === "active") getPermission().catch(() => {});
		});
		return () => { subscription.remove(); closed.current = true; request.current?.abort(); };
	}, [getPermission]);

	useEffect(() => {
		if (!permission || permission.granted || !permission.canAskAgain || askedPermission.current) return;
		askedPermission.current = true;
		requestPermission().catch(() => setMessage("Couldn't request camera access. Please try again in Settings."));
	}, [permission, requestPermission]);

	// Wait for the iOS sheet to finish dismissing before pushing book details.
	function didDismiss() {
		if (delivered.current) return;
		delivered.current = true;
		onClose();
		pendingAction.current?.();
	}
	useEffect(() => {
		if (!visible && Platform.OS !== "ios") didDismiss();
	}, [visible]);

	function finish(action) {
		if (closed.current) return;
		closed.current = true;
		busy.current = true;
		request.current?.abort();
		pendingAction.current = action;
		setVisible(false);
	}

	async function lookupISBN(scannedISBN) {
		setISBN(scannedISBN);
		setLoading(true);
		setTorch(false);
		setMessage("");
		request.current?.abort();
		const controller = new AbortController();
		request.current = controller;
		try {
			const book = await Book.findByISBN(scannedISBN, controller.signal);
			if (closed.current || controller.signal.aborted) return;
			if (book) finish(() => onBook(book));
			else setMessage("No book was found for this ISBN. You can scan another book or enter its details yourself.");
		} catch (error) {
			if (!closed.current && !controller.signal.aborted) setMessage("Couldn't look up this book. Check your connection and try again.");
		} finally {
			if (!closed.current && !controller.signal.aborted) setLoading(false);
		}
	}

	function onBarcodeScanned(result) {
		if (busy.current || closed.current || appState !== "active" || result.type !== "ean13" || !isBookISBN(result.data)) return;
		busy.current = true; // Camera callbacks can repeat before React renders.
		lookupISBN(normalizedISBN(result.data));
	}

	function scanAgain() {
		busy.current = false;
		setMessage("");
		setCameraError(false);
		setISBN("");
	}

	return (
		<Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onDismiss={didDismiss}
			onRequestClose={() => finish()} supportedOrientations={["portrait", "landscape-left", "landscape-right"]}>
			<SafeAreaView style={layout.page}>
				<View style={layout.header}>
					<Pressable accessibilityRole="button" onPress={() => finish()} style={layout.button}><Text style={layout.text}>Cancel</Text></Pressable>
					<Text accessibilityRole="header" style={layout.title}>Scan Book</Text>
					<View style={layout.headerSpacer} />
				</View>
				{loading ? (
					<View style={layout.center}><ActivityIndicator color="white" /><Text style={layout.explanation}>Looking up {isbn}…</Text></View>
				) : message ? (
					<View style={layout.center}>
						<Text style={layout.explanation}>{message}</Text>
						{isbn !== "" && <Pressable accessibilityRole="button" onPress={() => lookupISBN(isbn)} style={layout.button}><Text style={layout.text}>Try Again</Text></Pressable>}
						<Pressable accessibilityRole="button" onPress={scanAgain} style={layout.button}><Text style={layout.text}>Scan Again</Text></Pressable>
						{isbn !== "" && <Pressable accessibilityRole="button" onPress={() => finish(() => onManualEntry(isbn))} style={layout.button}><Text style={layout.text}>Enter Book Details</Text></Pressable>}
					</View>
				) : !permission ? (
					<View style={layout.center}><ActivityIndicator color="white" /></View>
				) : !permission.granted ? (
					<View style={layout.center}>
						<Text style={layout.explanation}>Allow camera access to scan a book's ISBN barcode.</Text>
						<Pressable accessibilityRole="button" style={layout.button} onPress={() => {
							const action = permission.canAskAgain ? requestPermission : Linking.openSettings;
							action().catch(() => setMessage("Couldn't open camera permissions. Please check Settings."));
						}}><Text style={layout.text}>{permission.canAskAgain ? "Allow Camera Access" : "Open Settings"}</Text></Pressable>
					</View>
				) : (
					<>
						<View style={layout.preview}>
							{visible && appState === "active" && !cameraError && <CameraView style={StyleSheet.absoluteFill} facing="back" autofocus="on"
								mute enableTorch={torch} barcodeScannerSettings={{ barcodeTypes: ["ean13"] }} onBarcodeScanned={onBarcodeScanned}
								onMountError={() => { busy.current = true; setCameraError(true); setTorch(false); setMessage("Couldn't start the camera. Please try again on a device with a camera."); }} />}
							<View pointerEvents="none" style={layout.guideContainer}><View style={layout.guide} /></View>
						</View>
						<Text style={layout.explanation}>Point the camera at the ISBN barcode on the back of a book.</Text>
						<Pressable accessibilityRole="button" accessibilityLabel="Flashlight" accessibilityState={{ selected: torch }}
							onPress={() => setTorch(!torch)} style={layout.torch}>
							<Icon name="flashlight" color={torch ? "#FFB45A" : "white"} size={24} />
						</Pressable>
					</>
				)}
			</SafeAreaView>
		</Modal>
	);
}

const layout = StyleSheet.create({
	page: { flex: 1, backgroundColor: "black" },
	header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
	headerSpacer: { width: 80 },
	title: { color: "white", fontSize: 18, fontWeight: "600" },
	text: { color: "white", fontSize: 17 },
	button: { minWidth: 80, minHeight: 44, padding: 12, alignItems: "center", justifyContent: "center" },
	preview: { flex: 1, overflow: "hidden" },
	guideContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
	guide: { width: "80%", maxWidth: 420, height: 170, borderWidth: 2, borderColor: "white", borderRadius: 16 },
	center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
	explanation: { color: "white", fontSize: 17, textAlign: "center", padding: 24 },
	torch: { alignSelf: "center", padding: 16, marginBottom: 8, borderRadius: 28, backgroundColor: "#34343A" }
});
