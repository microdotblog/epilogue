import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, DeviceEventEmitter, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { keys, libbyConnectedEvent } from "../Constants";
import { useEpilogueStyle } from "../hooks/useEpilogueStyle";
import storage from "../Storage";

const apiURL = "https://micro.blog/books/libby";
const pollInterval = 2000;
const pollTimeout = 5 * 60 * 1000;
const statusError = "Could not check your Libby connection. Please try again.";
const connectError = "Could not connect to Libby. Please try again.";
const progressLabels = {
	checking: "Checking your Libby connection…",
	submitting: "Connecting to Libby…",
	syncing: "Syncing your library loans and holds…"
};

export function ConnectLibbyScreen() {
	const styles = useEpilogueStyle();
	const dark = useColorScheme() === "dark";
	const [code, setCode] = useState("");
	const [state, setState] = useState({ status: "checking" });
	const cancelRef = useRef(null);

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
			setState(nextState);
			if (nextState.status === "connected") DeviceEventEmitter.emit(libbyConnectedEvent);
		};
		const fail = message => finish({ status: "error", message });
		cancelRef.current = cancel;
		setState({ status: setupCode === undefined ? "checking" : "submitting" });

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
						setCode("");
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
					const response = await fetch(`${apiURL}/status`, { headers, signal });
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
					setCode("");
					setState({ status: "syncing" });
					deadline = setTimeout(() => fail("Libby is taking longer than expected. Reopen this screen to check your connection."), pollTimeout);
				}
				nextPoll = setTimeout(checkStatus, pollInterval);
			}

			if (setupCode === undefined) {
				await checkStatus();
			}
			else {
				const response = await fetch(`${apiURL}/connect`, {
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
	}, []);

	useFocusEffect(useCallback(() => {
		setCode("");
		run();
		return () => cancelRef.current?.();
	}, [run]));

	const progress = progressLabels[state.status];
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
			{progress ? (
				<View style={libbyStyles.progress}>
					<ActivityIndicator color={dark ? "#FFFFFF" : "#000000"} />
					<Text style={[styles.signInText, libbyStyles.message]} accessibilityLiveRegion="polite">{progress}</Text>
				</View>
			) : state.status === "connected" ? (
				<>
					<Text style={[styles.signInText, libbyStyles.statusTitle]} accessibilityRole="header">
						{state.libraryName ? `Connected to ${state.libraryName}` : "Connected to Libby"}
					</Text>
					<Text style={styles.signInText}>Your library loans and holds appear in Bookshelves.</Text>
				</>
			) : (
				<>
					<Text style={styles.signInText}>In Libby, open Copy To Another Device → Other Options → Sonos to generate a setup code.</Text>
					<Text style={[styles.signInText, libbyStyles.label]}>Setup code</Text>
					<TextInput
						style={[styles.signInInput, libbyStyles.input]}
						accessibilityLabel="Libby setup code"
						keyboardType="number-pad"
						returnKeyType="go"
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
	progress: { alignItems: "center", gap: 12, paddingTop: 12 },
	message: { textAlign: "center" },
	statusTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
	label: { fontWeight: "600", marginBottom: 6 },
	input: { minHeight: 44, fontSize: 17 },
	error: { fontSize: 15, marginTop: 12 },
	button: { alignSelf: "flex-start", justifyContent: "center", minHeight: 44, marginLeft: 0, marginTop: 14, paddingHorizontal: 18 },
	buttonTitle: { fontSize: 16, fontWeight: "600" },
	dimmed: { opacity: 0.55 }
});
