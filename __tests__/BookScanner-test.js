import React from "react";
import { AppState, Linking, Modal, Platform } from "react-native";
import renderer from "react-test-renderer";
import { CameraView, useCameraPermissions } from "expo-camera";
import { BookScanner } from "../src/BookScanner";
import { BookSearchField } from "../src/BookSearchField";
import { Book } from "../src/models/Book";

jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: require("react-native").View }));
const isbn = "9780140328721";
const book = new Book(isbn, "Matilda", "Roald Dahl", "https://example.com/cover.jpg");
const originalOS = Platform.OS;
const originalAppState = AppState.currentState;
let screen, appStateChanged;
let permission, requestPermission, getPermission, props;

beforeEach(() => {
	permission = { granted: true, canAskAgain: true };
	requestPermission = jest.fn(async () => {});
	getPermission = jest.fn(async () => {});
	useCameraPermissions.mockImplementation(() => [permission, requestPermission, getPermission]);
	AppState.currentState = "active";
	jest.spyOn(AppState, "addEventListener").mockImplementation((name, listener) => {
		appStateChanged = listener;
		return { remove: jest.fn() };
	});
	jest.spyOn(Book, "findByISBN").mockResolvedValue(book);
	props = { onClose: jest.fn(), onBook: jest.fn(), onManualEntry: jest.fn() };
});
afterEach(async () => {
	await renderer.act(async () => screen?.unmount());
	Platform.OS = originalOS;
	AppState.currentState = originalAppState;
	jest.restoreAllMocks();
});
async function open() { await renderer.act(async () => { screen = renderer.create(<BookScanner {...props} />); }); }
function scan(data = isbn, type = "ean13") { screen.root.findByType(CameraView).props.onBarcodeScanned({ data, type }); }
function button(title) {
	return screen.root.findAll(node => typeof node.props.onPress === "function")
		.find(node => node.findAll(child => child.props.children === title).length > 0);
}

it("ignores non-book barcodes, scans once, and waits for iOS dismissal before navigating", async () => {
	Platform.OS = "ios";
	await open();
	await renderer.act(async () => { scan("51495"); scan("9780140328722"); scan(isbn, "qr"); });
	expect(Book.findByISBN).not.toHaveBeenCalled();
	const onScan = screen.root.findByType(CameraView).props.onBarcodeScanned;
	await renderer.act(async () => { onScan({ data: isbn, type: "ean13" }); onScan({ data: isbn, type: "ean13" }); });
	expect(Book.findByISBN).toHaveBeenCalledTimes(1);
	expect(screen.root.findAllByType(CameraView)).toHaveLength(0);
	expect(props.onBook).not.toHaveBeenCalled();
	await renderer.act(async () => screen.root.findByType(Modal).props.onDismiss());
	expect(props.onClose).toHaveBeenCalledTimes(1);
	expect(props.onBook).toHaveBeenCalledWith(book);
	await renderer.act(async () => screen.root.findByType(Modal).props.onDismiss());
	expect(props.onBook).toHaveBeenCalledTimes(1);
});

it("delivers Android scans without relying on the iOS onDismiss event", async () => {
	Platform.OS = "android";
	await open();
	await renderer.act(async () => scan());
	expect(props.onBook).toHaveBeenCalledWith(book);
});

it("requests camera access, handles denial and offers Settings", async () => {
	permission = { granted: false, canAskAgain: true };
	await open();
	expect(requestPermission).toHaveBeenCalledTimes(1);
	expect(screen.root.findAllByType(CameraView)).toHaveLength(0);
	permission = { granted: false, canAskAgain: false };
	jest.spyOn(Linking, "openSettings").mockResolvedValue();
	await renderer.act(async () => screen.update(<BookScanner {...props} />));
	await renderer.act(async () => button("Open Settings").props.onPress());
	expect(Linking.openSettings).toHaveBeenCalledTimes(1);
});

it("turns the flashlight on and unmounts the camera in the background", async () => {
	await open();
	await renderer.act(async () => screen.root.findByProps({ accessibilityLabel: "Flashlight" }).props.onPress());
	expect(screen.root.findByType(CameraView).props.enableTorch).toBe(true);
	await renderer.act(async () => appStateChanged("background"));
	expect(screen.root.findAllByType(CameraView)).toHaveLength(0);
	await renderer.act(async () => appStateChanged("active"));
	expect(getPermission).toHaveBeenCalledTimes(1);
	expect(screen.root.findAllByType(CameraView)).toHaveLength(1);
});

it("offers manual entry with the scanned ISBN and lets the user rescan", async () => {
	Platform.OS = "android";
	Book.findByISBN.mockResolvedValue(null);
	await open();
	await renderer.act(async () => scan());
	expect(props.onBook).not.toHaveBeenCalled();
	await renderer.act(async () => button("Scan Again").props.onPress());
	expect(screen.root.findAllByType(CameraView)).toHaveLength(1);
	await renderer.act(async () => scan());
	await renderer.act(async () => button("Enter Book Details").props.onPress());
	expect(props.onManualEntry).toHaveBeenCalledWith(isbn);
});

it("allows retrying a failed lookup and cancels pending results on close", async () => {
	Platform.OS = "android";
	Book.findByISBN.mockRejectedValueOnce(new Error("Offline"));
	await open();
	await renderer.act(async () => scan());
	let resolve;
	Book.findByISBN.mockImplementation(() => new Promise(done => { resolve = done; }));
	await renderer.act(async () => { button("Try Again").props.onPress(); });
	const signal = Book.findByISBN.mock.calls.at(-1)[1];
	await renderer.act(async () => screen.root.findByType(Modal).props.onRequestClose());
	expect(signal.aborted).toBe(true);
	await renderer.act(async () => resolve(book));
	expect(props.onClose).toHaveBeenCalledTimes(1);
	expect(props.onBook).not.toHaveBeenCalled();
});

it("offers a retry if the camera cannot start", async () => {
	await open();
	await renderer.act(async () => screen.root.findByType(CameraView).props.onMountError());
	expect(screen.root.findAllByType(CameraView)).toHaveLength(0);
	await renderer.act(async () => button("Scan Again").props.onPress());
	expect(screen.root.findAllByType(CameraView)).toHaveLength(1);
});

it("preserves the search field ref and converts scans to the existing detail parameters", async () => {
	const onBook = jest.fn(), clear = jest.fn(), ref = React.createRef();
	let blur;
	const navigation = { addListener: (event, listener) => { blur = listener; return jest.fn(); } };
	await renderer.act(async () => { screen = renderer.create(<BookSearchField ref={ref} navigation={navigation} styles={{}} onBook={onBook} />,
		{ createNodeMock: () => ({ clear }) }); });
	expect(typeof ref.current.clear).toBe("function");
	await renderer.act(async () => screen.root.findByProps({ testID: "scan-book" }).props.onPress());
	await renderer.act(async () => screen.root.findByType(BookScanner).props.onBook(book));
	expect(onBook).toHaveBeenCalledWith(expect.objectContaining({ isbn, image: book.cover_url, is_search: true }));
	await renderer.act(async () => blur());
	expect(screen.root.findAllByType(BookScanner)).toHaveLength(0);
});
