export const keys = {
	authToken: "auth_token",
	currentUsername: "current_username",
	currentBlogID: "current_blog_id",
	currentBlogName: "current_blog_name",
	currentBookshelf: "current_bookshelf",
	currentSearch: "current_search",
	currentText: "current_text",
	allBookshelves: "bookshelves",
	meURL: "me_url",
	authState: "auth_state",
	authURL: "auth_url",
	tokenURL: "token_url",
	micropubURL: "micropub_url",
	micropubToken: "micropub_token",
	lastMicropubToken: "last_micropub"
};

export const errors = {
	noAuthorizationEndpoint: "Could not find IndieAuth authorization endpoint.",
	noTokenEndpoint: "Could not find IndieAuth token endpoint.",
	noMicropubEndpoint: "Could not find Micropub endpoint.",
	stateDoesNotMatch: "IndieAuth state did not match."
};