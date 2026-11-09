import React from "react";
import { PostPreview } from "../PostPreview";
import { BookDetailsScreen } from "./BookDetailsScreen";
import { MovieDetailsScreen } from "./MovieDetailsScreen";

export function PostDetailsScreen({ navigation, route }) {
	const { book, post } = route.params;
	return book ? (
		<BookDetailsScreen navigation={navigation} route={{ ...route, params: book }} post={post} />
	) : (
		<MovieDetailsScreen navigation={navigation} route={route} postPreview={<PostPreview key={post.url} post={post} />} />
	);
}
