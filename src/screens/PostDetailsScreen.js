import React from "react";
import { PostPreview } from "../PostPreview";
import { BookDetailsScreen } from "./BookDetailsScreen";
import { MovieDetailsScreen } from "./MovieDetailsScreen";

export function PostDetailsScreen({ navigation, route }) {
	const { book, post } = route.params;
	const postPreview = <PostPreview key={post.url} post={post} />;
	return book ? (
		<BookDetailsScreen navigation={navigation} route={{ ...route, params: book }} postPreview={postPreview} />
	) : (
		<MovieDetailsScreen navigation={navigation} route={route} postPreview={postPreview} />
	);
}
