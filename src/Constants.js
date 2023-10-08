export const keys = {
	authToken: "auth_token",
	currentUsername: "current_username",
	currentBlogID: "current_blog_id",
	currentBlogName: "current_blog_name",
	currentBookshelf: "current_bookshelf",
	currentSearch: "current_search",
	currentTitle: "current_title",
	currentText: "current_text",
	currentTextExtra: "current_extra",
	currentPostURL: "current_post_url",
	allBookshelves: "bookshelves",
	meURL: "me_url",
	authState: "auth_state",
	authURL: "auth_url",
	tokenURL: "token_url",
	micropubURL: "micropub_url",
	micropubToken: "micropub_token",
	lastMicropubToken: "last_micropub",
	appleUserID: "apple_user_id",
	appleIdentityToken: "apple_identity_token",
	openLibrarySession: "openlibrary_session",
	openLibraryUsername: "openlibrary_username"
};

export const errors = {
	noAuthorizationEndpoint: "Could not find IndieAuth authorization endpoint.",
	noTokenEndpoint: "Could not find IndieAuth token endpoint.",
	noMicropubEndpoint: "Could not find Micropub endpoint.",
	stateDoesNotMatch: "IndieAuth state did not match."
};