import React from "react";
import renderer from "react-test-renderer";
import storage from "../src/Storage";
import { keys } from "../src/Constants";
import { refreshProfileAvatar, useProfileHeader } from "../src/ProfileHeaderButton";
import { SidebarVisibleContext } from "../src/navigation/SidebarContext";

it("restores the profile button when the sidebar hides and refreshes after sign-in", async () => {
	const navigation = { setOptions: jest.fn(), navigate: jest.fn(), addListener: () => () => {} };
	const styles = {};
	function Header() {
		useProfileHeader(navigation, styles);
		return null;
	}
	const render = visible => <SidebarVisibleContext.Provider value={visible}><Header /></SidebarVisibleContext.Provider>;
	const options = () => navigation.setOptions.mock.calls.at(-1)[0];
	let screen;
	await storage.set(keys.currentUsername, "first");
	await renderer.act(async () => { screen = renderer.create(render(true)); });
	expect(options().unstable_headerLeftItems()).toEqual([]);
	await renderer.act(async () => screen.update(render(false)));
	let button = options().unstable_headerLeftItems()[0].element;
	expect(button.props.children.props.source.uri).toBe("https://micro.blog/first/avatar.jpg");
	button.props.onPress();
	expect(navigation.navigate).toHaveBeenCalledWith("Profile");
	await renderer.act(async () => {
		await storage.set(keys.currentUsername, "second");
		refreshProfileAvatar();
	});
	button = options().unstable_headerLeftItems()[0].element;
	expect(button.props.children.props.source.uri).toBe("https://micro.blog/second/avatar.jpg");
	await renderer.act(async () => screen.unmount());
	await storage.remove(keys.currentUsername);
});
