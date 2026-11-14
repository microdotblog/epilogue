import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { keys, libbyAPIURL, libbyConnectedEvent } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import { LibbyBooksGrid, useLibbyBooks } from "../LibbyBooksGrid";
import storage from "../Storage";

const pollInterval = 2000;
const pollTimeout = 5 * 60 * 1000;
const statusError = "Could not check your Libby connection. Please try again.";
const connectError = "Could not connect to Libby. Please try again.";
const progressLabels = {
	submitting: "Connecting to Libby…",
	syncing: "Syncing your library loans and holds…"
};

function useLibbyConnection(onStateChange) {
	const cancelRef = useRef(null);
	const cancel = useCallback(() => cancelRef.current?.(), []);

	const run = useCallback(async (setupCode) => {
		if (cancelRef.current) return;

		const controller = new AbortController();
		const { signal } = controller;
		let nextPoll;
		let deadline;
		const cancel = () => {
			clearTimeout(nextPoll);
			clearTimeout(deadline);
			controller.abort();
			cancelRef.current = null;
		};
		const finish = nextState => {
			if (signal.aborted) return;
			cancel();
			onStateChange(nextState);
		};
		const fail = message => finish({ status: "error", message });
		cancelRef.current = cancel;
		onStateChange({ status: setupCode === undefined ? "checking" : "submitting" });

		try {
			const token = await storage.get(keys.authToken);
			if (signal.aborted) return;
			if (!token) {
				fail("Sign in to Micro.blog to connect to Libby.");
				return;
			}

			const headers = { Authorization: `Bearer ${token}` };
			const handleStatus = (data, fallback) => {
				switch (data?.status) {
					case "syncing":
						beginPolling();
						break;
					case "connected":
						finish({ status: "connected", libraryName: data.library_name });
						break;
					case "not_connected":
						finish({ status: "not_connected" });
						break;
					default:
						fail(data?.message || fallback);
				}
			};

			async function checkStatus() {
				try {
				const response = await fetch(`${libbyAPIURL}/status`, { headers, signal });
					const data = await response.json().catch(() => null);
					if (signal.aborted) return;
					if (response.ok) handleStatus(data, statusError);
					else fail(data?.message || statusError);
				}
				catch {
					fail(statusError);
				}
			}

			function beginPolling() {
				if (deadline == null) {
					onStateChange({ status: "syncing" });
					deadline = setTimeout(() => fail("Libby is taking longer than expected. Reopen this screen to check your connection."), pollTimeout);
				}
				nextPoll = setTimeout(checkStatus, pollInterval);
			}

			if (setupCode === undefined) {
				await checkStatus();
			}
			else {
			const response = await fetch(`${libbyAPIURL}/connect`, {
					method: "POST",
					headers: { ...headers, "Content-Type": "application/json" },
					body: JSON.stringify({ code: setupCode }),
					signal
				});
				if (signal.aborted) return;
				if (response.status === 202) {
					beginPolling();
					return;
				}
				const data = await response.json().catch(() => null);
				if (signal.aborted) return;
				if (response.ok) handleStatus(data, connectError);
				else fail(data?.message || connectError);
			}
		}
		catch {
			fail(setupCode === undefined ? statusError : connectError);
		}
	}, [onStateChange]);

	return { run, cancel };
}

function LibbyProgress({ status }) {
	const styles = useEpilogueStyle();
	const dark = useColorScheme() === "dark";
	return (
		<View style={libbyStyles.progress}>
			<ActivityIndicator color={dark ? "#FFFFFF" : "#000000"} />
			<Text style={[styles.signInText, libbyStyles.message]} accessibilityLiveRegion="polite">{progressLabels[status]}</Text>
		</View>
	);
}

function LibbyLibraryLoading() {
	const dark = useColorScheme() === "dark";
	return (
		<View style={libbyStyles.centeredLoading}>
			<ActivityIndicator color={dark ? "#FFFFFF" : "#000000"} accessibilityLabel="Loading Libby library" />
		</View>
	);
}

export function LibbyLibraryScreen({ navigation, route }) {
	const styles = useEpilogueStyle();
	const [state, setState] = useState({ status: "checking" });
	const refreshKey = route.params?.refreshKey ?? route.key;
	const statusLoaded = state.status === "connected" && state.refreshKey === refreshKey;
	const libraryBooks = useLibbyBooks(statusLoaded ? refreshKey : null);
	const onStateChange = useCallback(nextState => {
		if (nextState.status === "not_connected" || nextState.status === "error") {
			navigation.replace("ConnectLibby", { message: nextState.message });
			return;
		}
		setState({ ...nextState, refreshKey });
		if (nextState.status === "connected") DeviceEventEmitter.emit(libbyConnectedEvent);
	}, [navigation, refreshKey]);
	const { run, cancel } = useLibbyConnection(onStateChange);

	useFocusEffect(useCallback(() => {
		if (statusLoaded) return;
		run();
		return cancel;
	}, [run, cancel, statusLoaded]));

	if (state.status === "syncing") {
		return (
			<ScrollView contentContainerStyle={libbyStyles.content} contentInsetAdjustmentBehavior="automatic">
				<LibbyProgress status={state.status} />
			</ScrollView>
		);
	}
	if (!libraryBooks) return <LibbyLibraryLoading />;

	return (
		<ScrollView contentContainerStyle={libbyStyles.content} contentInsetAdjustmentBehavior="automatic">
			<Text style={[styles.signInText, libbyStyles.statusTitle]} accessibilityRole="header">
				{state.libraryName ? `Connected to ${state.libraryName}` : "Connected to Libby"}
			</Text>
			<Text style={[styles.signInText, libbyStyles.connectedDescription]}>Your library loans and holds appear in Bookshelves.</Text>
			<Pressable
				style={({ pressed }) => [styles.plainButton, libbyStyles.button, pressed && libbyStyles.dimmed]}
				accessibilityRole="button"
				onPress={() => navigation.push("ConnectLibby", { reconnect: true })}
			>
				<Text style={[styles.plainButtonTitle, libbyStyles.buttonTitle]}>Reconnect</Text>
			</Pressable>
			<LibbyBooksGrid books={libraryBooks.books} loadFailed={libraryBooks.loadFailed} />
		</ScrollView>
	);
}

export function ConnectLibbyScreen({ navigation, route }) {
	const styles = useEpilogueStyle();
	const dark = useColorScheme() === "dark";
	const [code, setCode] = useState("");
	const [state, setState] = useState({ status: "entering_code", message: route.params?.message });
	const onStateChange = useCallback(nextState => {
		if (nextState.status === "connected") {
			navigation.popTo("LibbyLibrary", { refreshKey: route.key });
			return;
		}
		if (nextState.status === "syncing") setCode("");
		setState(nextState);
	}, [navigation, route.key]);
	const { run, cancel } = useLibbyConnection(onStateChange);
	useFocusEffect(useCallback(() => cancel, [cancel]));

	const setupCode = code.trim();
	const submit = () => {
		if (!setupCode) return;
		Keyboard.dismiss();
		run(setupCode);
	};

	return (
		<ScrollView
			contentContainerStyle={libbyStyles.content}
			contentInsetAdjustmentBehavior="automatic"
			automaticallyAdjustKeyboardInsets
			keyboardShouldPersistTaps="handled"
		>
			{progressLabels[state.status] ? (
				<LibbyProgress status={state.status} />
			) : (
				<>
					<Text style={styles.signInText}>In Libby, open Copy To Another Device → Other Options → Sonos to generate a setup code.</Text>
					<Text style={[styles.signInText, libbyStyles.label]}>Setup code</Text>
					<TextInput
						style={[styles.signInInput, libbyStyles.input]}
						accessibilityLabel="Libby setup code"
						keyboardType="number-pad"
						value={code}
						onChangeText={setCode}
						onSubmitEditing={submit}
					/>
					{state.message ? (
						<Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={[libbyStyles.error, { color: dark ? "#FFABA5" : "#B42318" }]}>{state.message}</Text>
					) : null}
					<Pressable
						style={({ pressed }) => [styles.plainButton, libbyStyles.button, (pressed || !setupCode) && libbyStyles.dimmed]}
						accessibilityRole="button"
						accessibilityState={{ disabled: !setupCode }}
						disabled={!setupCode}
						onPress={submit}
					>
						<Text style={[styles.plainButtonTitle, libbyStyles.buttonTitle]}>Connect</Text>
					</Pressable>
				</>
			)}
		</ScrollView>
	);
}

const libbyStyles = StyleSheet.create({
	content: { width: "100%", maxWidth: 520, alignSelf: "center", padding: 20 },
	centeredLoading: { flex: 1, alignItems: "center", justifyContent: "center" },
	progress: { alignItems: "center", gap: 12, paddingTop: 12 },
	message: { textAlign: "center" },
	statusTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
	connectedDescription: { marginBottom: 0 },
	label: { fontWeight: "600", marginBottom: 6 },
	input: { minHeight: 44, fontSize: 17 },
	error: { fontSize: 15, marginTop: 12 },
	button: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, marginLeft: 0, marginTop: 14, paddingHorizontal: 18 },
	buttonTitle: { fontSize: 16, fontWeight: "600" },
	dimmed: { opacity: 0.55 }
});
