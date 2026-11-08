import React from "react";
import { FlatList, TextInput } from "react-native";
import { InAppBrowser } from "react-native-inappbrowser-reborn";
import renderer from "react-test-renderer";
import { MoviesScreen } from "../src/screens/MoviesScreen";

jest.mock("@react-navigation/native", () => ({ useScrollToTop: jest.fn() }));
jest.mock("../src/ProfileHeaderButton", () => ({ useProfileHeader: jest.fn() }));
jest.mock("../src/Storage", () => ({ get: jest.fn(async () => "test-token") }));

const originalFetch = global.fetch;
let screen;

afterEach(async () => {
	await renderer.act(async () => screen?.unmount());
	global.fetch = originalFetch;
	jest.clearAllMocks();
});

it("opens blogged movies in the shared detail screen and keeps external listings in the browser", async () => {
	const postURL = "https://example.com/review";
	const externalURL = "https://letterboxd.com/film/a-film/";
	const avatar = "https://example.com/avatar.jpg";
	const poster = "https://example.com/poster.jpg";
	global.fetch = jest.fn(async () => ({ json: async () => ({
		items: [
			{ id: 1, title: "A blogged movie", url: postURL, content_text: "A movie overview.", authors: [{ name: "Blogger", avatar }],
				_microblog: { link_url: postURL, poster_url: poster, username: "viewer" } },
			{ id: 2, title: "A film", url: externalURL, _microblog: { letterboxd_url: externalURL } }
		]
	}) }));
	let focus;
	const navigation = { navigate: jest.fn(), addListener: (event, handler) => { focus = handler; return () => {}; } };
	await renderer.act(async () => { screen = renderer.create(<MoviesScreen navigation={navigation} />); });
	await renderer.act(async () => focus());
	const list = screen.root.findByType(FlatList).props;
	list.renderItem({ item: list.data[0] }).props.onPress();
	expect(navigation.navigate).toHaveBeenCalledWith("PostDetails", {
		post: { url: postURL, avatar, author: "Blogger", username: "viewer" },
		movie: expect.objectContaining({ title: "A blogged movie", largeImage: poster, overview: "A movie overview." })
	});
	expect(InAppBrowser.open).not.toHaveBeenCalled();
	list.renderItem({ item: list.data[1] }).props.onPress();
	expect(InAppBrowser.open).toHaveBeenCalledWith(externalURL, { animated: true });

	global.fetch.mockResolvedValue({ json: async () => ({ items: [
		{ id: "movie-1", title: "A movie" },
		{ id: "tv-1", title: "A series", _microblog: { seasons_count: 2 } }
	] }) });
	const input = screen.root.findByType(TextInput);
	input.props.onChangeText("movie");
	await renderer.act(async () => input.props.onEndEditing());
	const search = screen.root.findByType(FlatList).props;
	search.renderItem({ item: search.data[0] }).props.onPress();
	expect(navigation.navigate).toHaveBeenLastCalledWith("MovieDetails", { movie: expect.objectContaining({ id: "movie-1" }) });
	search.renderItem({ item: search.data[1] }).props.onPress();
	expect(navigation.navigate).toHaveBeenLastCalledWith("TVSeasons", { movie: expect.objectContaining({ id: "tv-1" }) });
});
