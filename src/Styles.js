import { StyleSheet } from "react-native";

export const light = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 10
	},
	profileIcon: {
		marginLeft: 20,
		width: 24,
		height: 24,
		borderRadius: 12
	},
	navbarBookshelf: {
		flexDirection: "row",
		alignItems: "center"
	},
	navbarBookshelfIcon: {
		color: "#337AB7"
	},
	navbarBookshelfTriangle: {
		marginLeft: 5,
		marginRight: 14
	},
	navbarBookshelfTitle: {
		color: "#000",
		marginLeft: 0,
		fontSize: 16,
		fontWeight: "bold"
	},
	item: {
		flexDirection: "row",
		height: 90,
		paddingLeft: 20,
		paddingRight: 20,
		paddingTop: 5,
		paddingBottom: 5,
		marginBottom: 5
	},
	selectedItem: {
		flexDirection: "row",
		height: 90,
		paddingLeft: 20,
		paddingRight: 20,
		paddingTop: 5,
		paddingBottom: 5,
		marginBottom: 5,
		backgroundColor: "#DEDEDE"
	},
	itemTrash: {
		alignSelf: "center"
	},
	bookItem: {
		flex: 1,
		marginLeft: 5,
		justifyContent: "center"
	},
	bookTitle: {
		paddingLeft: 7
	},
	bookAuthor: {
		paddingTop: 4,
		paddingLeft: 7,
		color: "#777777"
	},
	bookSecondary: {
		paddingTop: 4,
		paddingLeft: 7,
		color: "#777777"
	},
	bookCover: {
		marginTop: 5,
		width: 50,
		height: 70,
		borderRadius: 4
	},
	bookDetails: {
		alignItems: "center",
		marginTop: 5
	},
	bookDetailsColumns: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF",
		width: "100%",
		borderTopWidth: 1,
		borderTopColor: "#DEDEDE",
		borderBottomWidth: 1,
		borderBottomColor: "#DEDEDE",
		marginBottom: 20,
		marginTop: 20,
		paddingLeft: 20,
		paddingRight: 20,
		paddingTop: 10,
		paddingBottom: 10
	},
	bookDetailsFields: {
		alignItems: "flex-start",
		flex: 1,
	},
	bookDetailsTop: {
		alignItems: "center"
	},
	bookDetailsCover: {
		width: 200,
		height: 200,
		resizeMode: "contain"
	},
	bookDetailsMenuButton: {
		marginLeft: 5
	},
	bookDetailsMenuContainer: {
		width: 28,
		height: 28,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: 5
	},
	bookDetailsMenuIcon: {
		width: 18,
		height: 18
	},
	bookDetailsTitle: {
		marginTop: 3,
		fontWeight: "bold"
	},
	bookDetailsAuthor: {
		marginTop: 5,
		color: "#777777"
	},
	bookDetailsBookshelves: {
		marginTop: 5,
		marginLeft: 40,
		marginRight: 40
	},
	bookDetailsAddBar: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12
	},
	bookDetailsAddTo: {
		flex: 1
	},
	bookDetailsProgress: {
		flex: 1
	},
	bookDetailsButton: {
		flexDirection: "row",
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 5,
		marginBottom: 6,
		backgroundColor: "#DEDEDE"
	},	
	bookDetailsButtonPressed: {
		backgroundColor: "#BBBBBB",
	},
	bookDetailsBookshelfTitle: {
		flex: 1
	},
	bookDetailsBookshelfCount: {
		flex: 1,
		textAlign: "right",
		color: "#777777"
	},
	navbarNewIcon: {
		width: 22,
		height: 22,
		tintColor: "#337AB7"
	},
	navbarBackIcon: {
		width: 19,
		height: 25,
		tintColor: "#337AB7"
	},
	removeAction: {
		backgroundColor: "#AAAAAA",
		width: 100,
		alignItems: "center",
		marginBottom: 20
	},
	removeContainer: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center"
	},
	removeText: {
		color: "#FFFFFF"
	},
	searchField: {
		height: 36,
		marginTop: 1,
		marginBottom: 5,
		marginLeft: 20,
		marginRight: 20,
		paddingTop: 7,
		paddingBottom: 7,
		paddingLeft: 12,
		paddingRight: 12,
		borderRadius: 18,
		borderColor: "#ced3d8",
		borderWidth: 0.5,
		backgroundColor: "#FFFFFF"
	},
	discoverSearchField: {
		height: 36,
		marginTop: 1,
		marginBottom: 10,
		marginLeft: 20,
		marginRight: 20,
		paddingTop: 7,
		paddingBottom: 7,
		paddingLeft: 12,
		paddingRight: 12,
		borderRadius: 18,
		borderColor: "#ced3d8",
		borderWidth: 0.5,
		backgroundColor: "#FFFFFF"
	},
	discoverResults: {
		marginTop: 10,
		marginLeft: 8,
		marginRight: 8
	},
	discoverSearchResults: {
		marginTop: 10
	},
	navbarCloseIcon: {
		marginTop: 3,
		width: 22,
		height: 22,
		tintColor: "#337AB7"
	},
	navbarSubmit: {
		marginTop: 4,
		color: "#337AB7",
		fontSize: 16,
		fontWeight: "600"
	},
	postTextBox: {
	},
	postTextInput: {
		textAlignVertical: "top",
		fontSize: 16,
		lineHeight: 22,
		paddingLeft: 14,
		paddingRight: 14,
		paddingTop: 14,
		paddingBottom: 14
	},
	postTextNotice: {
		paddingLeft: 14,
		paddingRight: 14,
		paddingTop: 14,
		paddingBottom: 14,
		backgroundColor: "#e8e8e8",
		borderTopWidth: 0.5,
		borderTopColor: "#d6d6d6"
	},
	postTitleField: {
		fontSize: 16,
		fontWeight: "600",
		paddingLeft: 14,
		paddingRight: 14,
		paddingTop: 18,
		paddingBottom: 2
	},
	postHostnameBar: {
		flexDirection: "row",
		backgroundColor: "#e8e8e8",
		paddingTop: 8,
		paddingBottom: 8,
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6"
	},
	postHostnameLeft: {
		flex: 1,
		marginLeft: 15
	},
	postHostnameText: {
		flex: 3,
		paddingTop: 2,
		textAlign: "center"
	},
	postHostnameProgress: {
		flex: 1,
		alignItems: "flex-end",
		marginRight: 15
	},
	signIn: {
		flex: 1,
		flexDirection: "column",
		padding: 0,
		backgroundColor: "#EFEFEF"
	},
	signInContent: {
		padding: 20	
	},
	signInHeader: {
		flexDirection: "row",
		paddingLeft: 20,
		paddingRight: 20,
		paddingTop: 20,
		paddingBottom: 20,
		backgroundColor: "#FFF",
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6"
	},
	signInTextHeader: {
		flex: 1,
		fontSize: 15
	},
	signInImage: {
		width: 50,
		height: 50,
		marginTop: 15,
		marginLeft: 0,
		marginRight: 15,
	},
	signInText: {
		fontSize: 16,
		marginBottom: 20,
	},
	signInInput: {
		borderStyle: 'solid',
		borderColor: "rgba(0, 0, 0, 0.20)",
		borderWidth: 0.5,
		borderRadius: 4,
		padding: 10,
		backgroundColor: "#FFF"
	},
	signInLink: {
		color: "#337AB7",
		textDecorationLine: 'underline',
	},
	blogListContainer: {
		flex: 1
	},
	blogListItem: {
		paddingLeft: 15,
		paddingRight: 15,
		paddingTop: 16,
		paddingBottom: 16,
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6"
	},
	blogListName: {
	},
	profilePane: {
		flexDirection: "row",
		alignItems: "center",
		paddingBottom: 10,
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6"
	},
	profilePhoto: {
		width: 34,
		height: 34,
		borderRadius: 17,
		marginLeft: 15,
		backgroundColor: "#DEDEDE"
	},
	profileUsername: {
		marginLeft: 10
	},
	profilePosts: {		
	},
	profilePost: {
		flexDirection: "row",
		paddingTop: 15,
		paddingBottom: 15,
		paddingLeft: 15,
		paddingRight: 15,
		borderBottomColor: "#DEDEDE",
		borderBottomWidth: 0.5
	},
	profilePostCover: {
		width: 50,
		height: 70
	},
	profilePostContent: {
		flex: 1,
		marginLeft: 15,
		marginRight: 10
	},
	profilePostDate: {
		marginTop: 10,
		color: "#777777",
		fontSize: 12
	},
	profileExtras: {
		flexGrow: 1,
		marginRight: 15,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end"
	},
	profileStatus: {
		marginRight: 5,
		color: "#777777"
	},
	profileSpinner: {
		alignItems: "flex-end"
	},
	notesKeyIntro: {
		paddingLeft: 15,
		paddingRight: 15,
		paddingTop: 15
	},
	notesKeyLabel: {
		fontWeight: "bold",
		paddingLeft: 15,
		paddingRight: 15,
		paddingTop: 15
	},
	noteCell: {
		paddingBottom: 15,
		marginBottom: 15,
		borderBottomColor: "#d6d6d6",
		borderBottomWidth: 0.5
	},
	micropubPane: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 15,
		paddingTop: 15,
		paddingBottom: 15,
		borderBottomColor: "#d6d6d6",
		borderBottomWidth: 0.5,
		backgroundColor: "#e1e1e1"
	},
	micropubButton: {
		marginLeft: 12,
		paddingLeft: 8,
		paddingRight: 8,
		paddingTop: 4,
		paddingBottom: 4,
		borderRadius: 5,
		backgroundColor: "#c9c9c9"
	},
	micropubButtonTitle: {
		fontSize: 13
	},
	micropubIntro: {
		marginLeft: 12,
		marginTop: 10
	},
	micropubURL: {
		marginLeft: 12,
		marginTop: 16
	},
	bookDetailsMore: {
		marginTop: 15,
		marginBottom: 25,
		paddingTop: 20,
		paddingLeft: 20,
		paddingRight: 20,
		borderTopWidth: 1,
		borderTopColor: "#DEDEDE"
	},
	plainButton: {
		marginLeft: 12,
		paddingLeft: 8,
		paddingRight: 8,
		paddingTop: 4,
		paddingBottom: 4,
		borderRadius: 5,
		backgroundColor: "#DEDEDE"
	},
	plainButtonTitle: {
		color: "#000",
		fontSize: 13
	},
	bookDetailsDescription: {		
	},
	movieTitle: {
		fontWeight: "600",
		fontSize: 14
	},
	movieDescription: {
		marginTop: 20,
		paddingTop: 16,
		paddingLeft: 20,
		paddingRight: 20,
		paddingBottom: 4,
		borderTopWidth: 1,
		borderTopColor: "#DEDEDE"
	},
	bookDetailsNoDescription: {		
	},
	bookDetailsNotesSection: {
		marginTop: 0,
		marginBottom: 25,
		paddingTop: 20,
		paddingBottom: 20,
		paddingLeft: 20,
		paddingRight: 20,
		borderTopWidth: 1,
		borderTopColor: "#DEDEDE"
	},
	bookDetailsNotesHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 15
	},
	bookDetailsNotesTitle: {
		fontWeight: "bold"
	},
	// for books on discover page
	bookCovers: {
		height: '100%',
		width: '100%',
		resizeMode: 'cover',
		borderRadius: 4
	},
	discoverView: {
		flex: 1,
		paddingTop: 10
	},
	moviesCreditPane: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 16,
		paddingRight: 16,
		paddingTop: 12,
		paddingBottom: 12,
		borderTopWidth: 0.5,
		borderTopColor: "#d6d6d6",
		backgroundColor: "#e8e8e8"
	},
	moviesCreditImage: {
		width: 60,
		height: 60,
		marginRight: 15,
		resizeMode: "contain"
	},
	moviesCreditText: {
		color: "#4a4a4a",
		flex: 1,
		flexWrap: "wrap"
	},
	bookContainer: {
		flex: 1/3,
		flexDirection: 'column',
		height: 160,
		justifyContent: 'center',
		backgroundColor: '#DEDEDE',
		marginLeft: 8,
		marginRight: 8,
		marginBottom: 14,
		shadowColor: '#000',
		shadowOffset: {
			height: 2
		},
		shadowRadius: 2,
		shadowOpacity: 0.1,
	},
	placeholderTitleText: {
		textAlign: 'center',
		fontStyle: 'italic',
		fontSize: 15,
		fontWeight: '500',
		margin: 5,
	},
	placeholderAuthorText: {
		textAlign: 'center',
		margin: 5
	},
	loadingPage: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1,
	},
	addingBookSpinner: {
		flex: 1, 
		position: 'absolute', 
		justifyContent: 'center', 
		alignItems: 'center', 
		width: '100%', 
		height: '100%'
	},
	goalsContainer: {
		flex: 1
	},
	goalItem: {
		flexDirection: 'row',
		alignItems: 'center', 
		paddingLeft: 20,
		paddingRight: 20,
		paddingTop: 20,
		paddingBottom: 20,
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6"
	},
	goalDetails: {
		minWidth: 100
	},
	goalCovers: {
		paddingLeft: 20
	},
	goalCoverThumbnail: {		
		width: 50,
		height: 70,
		marginRight: 5,
		borderRadius: 4
	},
	goalName: {
	},
	goalProgress: {
		paddingTop: 7,
		color: "#777777"		
	},
	editGoalTitle: {
		fontWeight: "bold",
		paddingTop: 10,
		paddingLeft: 20,
		paddingRight: 20,
		paddingBottom: 10,
	},
	editGoalDescription: {
		paddingTop: 10,
		paddingLeft: 20,
		paddingRight: 20,
		paddingBottom: 10,
	},
	editGoalInput: {
		flexGrow: 1,
		marginTop: 10,
		marginLeft: 20,
		marginRight: 10,
		paddingTop: 10,
		paddingLeft: 10,
		paddingRight: 10,
		paddingBottom: 10,
		height: 44,
		backgroundColor: "#FFFFFF",
		borderRadius: 5		
	},
	editGoalBooks: {
		marginTop: 20
	},
	editGoalFieldAndButton: {
		flexDirection: "row"
	},
	editGoalButton: {
		height: 44,
		marginTop: 10,
		marginRight: 20,
		paddingVertical: 14,
		paddingHorizontal: 14,
		borderRadius: 5,
		marginBottom: 6,
		backgroundColor: "#DEDEDE"
	},	
	editGoalButtonPressed: {
		backgroundColor: "#BBBBBB",
	},
	editGoalButtonTitle: {		
	},
	postBooksContainer: {
		paddingTop: 6,
		paddingLeft: 9,
		paddingRight: 9	
	},
	goalsBanner: {
		backgroundColor: "#EFEFEF",
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6",
		paddingLeft: 20,
		paddingRight: 20,
		paddingTop: 17,
		paddingBottom: 15
	},
	goalsBannerText: {		
	},
	goalsBannerButton: {
		flexDirection: "row",
		marginTop: 14,
		marginBottom: 5,
		width: 200,
		padding: 10,
		backgroundColor: "#DEDEDE",
		borderRadius: 5,
		alignItems: "center",
	},
	goalsBannerIcon: {
		marginRight: 6,
		paddingTop: 0,
		marginTop: -1,
		paddingBottom: 0,
		marginBottom: 0
	},
	signInWithAppleIntro: {
		paddingTop: 20,
		fontSize: 15
	},
	signInWithAppleButton: {
		justifyContent: "center",
		alignItems: "center",
		padding: 15,
	},
	signUpText: {
		fontSize: 16,
		marginBottom: 20,
	},
	signUp: {
		flex: 1,
		flexDirection: "column",
		padding: 20,
		backgroundColor: "#EFEFEF"
	},
	signUpInput: {
		borderStyle: 'solid',
		borderColor: "rgba(0, 0, 0, 0.1)",
		borderWidth: 0.5,
		borderRadius: 4,
		padding: 10,
		backgroundColor: "#FFF"
	},
	signUpDescription: {
		fontSize: 14,
	},
	openLibraryBanner: {
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6"
	},
	openLibraryIntro: {
		color: "#000000",
		paddingLeft: 20,
		paddingRight: 20,
		paddingTop: 5,
		paddingBottom: 15
	},
	openLibrarySignin: {		
		marginLeft: 20,
		marginRight: 20,
		marginTop: 15,
		marginBottom: 15
	},
	openLibraryUsername: {
		borderStyle: 'solid',
		borderColor: "rgba(0, 0, 0, 0.20)",
		borderWidth: 0.5,
		borderRadius: 4,
		padding: 10,
		backgroundColor: "#FFF",
		marginBottom: 15
	},
	openLibraryPassword: {		
		borderStyle: 'solid',
		borderColor: "rgba(0, 0, 0, 0.20)",
		borderWidth: 0.5,
		borderRadius: 4,
		padding: 10,
		backgroundColor: "#FFF"
	},
	openLibrarySigninSpinner: {
		flex: 1,
		alignItems: "flex-start",
		marginTop: 25
	},
	openLibrarySession: {
		marginLeft: 20,
		marginRight: 20,
		marginTop: 15,
		marginBottom: 15		
	},
	openLibraryStatusBar: {
		flexDirection: "row",
		alignItems: "center"
	},
	openLibraryStatusUsername: {
		color: "#000000"
	},
	openLibraryStatusButton: {
		marginLeft: 15
	},
	openLibraryItem: {
		paddingLeft: 0
	},
	openLibrarySearch: {
		marginLeft: 0,
		marginRight: 0,
		marginTop: 15,
		marginBottom: 15
	},
	openLibrarySearchSpinner: {
		marginTop: 10,
	},
	openLibraryEditionsScreen: {
		paddingTop: 0,
	},
	openLibraryEditionsBar: {
		flexDirection: "row",
		alignItems: "center",
		paddingLeft: 15,
		paddingTop: 15,
		paddingBottom: 15,
		borderBottomColor: "#d6d6d6",
		borderBottomWidth: 0.5,
		backgroundColor: "#e1e1e1"
	},
	openLibraryEditionsTitle: {		
		fontSize: 13
	},
	openLibraryEditionsExtras: {
		marginLeft: 5,
		fontSize: 13,
		color: "#777777"
	},
	openLibraryEditionsProgress: {
		marginLeft: 8
	},
	openLibraryEditionsDetails: {
		alignItems: "center",
		marginTop: 20
	},
	openLibraryEditionsCover: {
		width: 200,
		height: 350,
		resizeMode: "contain",
		marginBottom: 20
	},
	openLibraryEditionsButton: {
		flexDirection: "row",
		marginLeft: 12,
		paddingLeft: 12,
		paddingRight: 12,
		paddingTop: 8,
		paddingBottom: 8,
		borderRadius: 5,
		backgroundColor: "#c9c9c9"
	},
	openLibraryEditionsButtonTitle: {		
	},
	openLibraryCoverSearch: {		
		marginLeft: 20,
		marginRight: 20,
		marginTop: 0,
		marginBottom: 15		
	},
	mediumBookCover: {
		width: 100,
		height: 140,
		backgroundColor: "#c9c9c9"
	},
	coverResults: {
		flexDirection: "row"
	},
	coverResultsOptions: {
		justifyContent: "center"
	},
	coverResultsButtonProgress: {
		flexDirection: "row",	
	},
	useThisCoverButton: {
		justifyContent: "center",
		height: 34,
		marginLeft: 12,
		marginRight: 12,
		paddingLeft: 12,
		paddingRight: 12,
		paddingTop: 8,
		paddingBottom: 8,
		borderRadius: 5,
		backgroundColor: "#DEDEDE"
	},
	useThisCoverTitle: {
		color: "#000000"
	},
	finishedDatePicker: {
		marginTop: 3,
		marginBottom: 20,
		paddingBottom: 25,
		borderBottomWidth: 0.5,
		borderBottomColor: "#d6d6d6"
	},
	finishedTimePickerRow: {		
		flexDirection: "row",
		marginLeft: 20
	},
	finishedProgress: {
		flex: 1,
		alignItems: "flex-end",
		marginRight: 20
	},
	episodeDetailsPoster: {
		width: "100%",
		height: "150",
		resizeMode: "contain",
		marginBottom: 10
	},
	episodeDetails: {
		alignItems: "center",
	},
	movieDetails: {
		marginTop: 15,
		marginBottom: 15
	},
	movieDetailsPoster: {
		width: 150,
		height: 200,
		marginBottom: 12,
		borderRadius: 4
	}
});

export const dark = StyleSheet.create({
	container: {
		backgroundColor: "#212936",
		color: "#E5E7EB"
	},
	bookTitle: {
		color: "#FFFFFF"	
	},
	bookAuthor: {
		color: "#777777"
	},		
	navbarBookshelfIcon: {
		tintColor: "#FFFFFF"
	},
	navbarBookshelfTitle: {
		color: "#FFFFFF"
	},
	searchField: {
		backgroundColor: "#000000",
		borderColor: "#1f1f1f",
		color: "#FFFFFF"
	},
	bookDetailsScroll: {
		backgroundColor: "#212936"
	},
	bookDetails: {
		borderBottomColor: "#444444"
	},
	bookDetailsTitle: {
		color: "#FFFFFF"
	},
	bookDetailsAuthor: {
		color: "#777777"
	},
	bookDetailsAddTo: {
		color: "#FFFFFF"
	},
	postTextBox: {
		backgroundColor: "#212936",
		color: "#E5E7EB",
		height: 2000
	},
	bookDetailsColumns: {
		backgroundColor: "#141723",
		borderTopColor: "#444444",
		borderBottomColor: "#444444"
	},
	bookDetailsButton: {
		backgroundColor: "#141723"
	},		
	bookDetailsButtonPressed: {
		backgroundColor: "#000000"
	},
	bookDetailsBookshelfTitle: {
		color: "#FFFFFF"
	},
	bookDetailsBookshelfCount: {
		color: "#777777"
	},
	blogListContainer: {
		backgroundColor: "#212936",
		color: "#E5E7EB"
	},
	blogListItem: {
		borderBottomColor: "#444444"			
	},
	blogListName: {
		color: "#E5E7EB"
	},
	postHostnameBar: {
		backgroundColor: "#000000",
		borderBottomColor: "#444444"
	},
	postHostnameText: {
		color: "#E5E7EB"
	},
	postTextInput: {
		color: "#E5E7EB"
	},
	navbarNewIcon: {
		tintColor: "#FFFFFF"
	},
	navbarBackIcon: {
		tintColor: "#FFFFFF"
	},
	navbarCloseIcon: {
		tintColor: "#FFFFFF"
	},
	navbarSubmit: {
		color: "#FFFFFF"
	},
	signIn: {
		backgroundColor: "#141723"
	},
	signInHeader: {
		backgroundColor: "#000",
		borderBottomColor: "#444444"
	},
	signInText: {
		color: "#E5E7EB"
	},
	signInTextHeader: {
		color: "#E5E7EB"
	},
	signInInput: {
		borderColor: "rgba(255, 255, 255, 0.1)",
		color: "#FFF",
		backgroundColor: "#000"
	},
	signInWithAppleIntro: {
		color: "#FFF"
	},
	profilePane: {		
		borderBottomColor: "#444444"
	},
	profileUsername: {
		color: "#E5E7EB"
	},
	profilePost: {
		borderBottomColor: "#444444"
	},
	profilePostText: {
		color: "#FFF"	
	},
	micropubPane: {
		borderBottomColor: "#444444",
		backgroundColor: "#272f3d"
	},
	micropubHostname: {
		color: "#E5E7EB"
	},
	micropubButton: {
		backgroundColor: "#141723"
	},
	micropubButtonTitle: {
		color: "#E5E7EB",
	},
	micropubIntro: {
		color: "#E5E7EB"
	},
	micropubURL: {
		color: "#E5E7EB"
	},
	plainButton: {
		backgroundColor: "#272f3d"
	},
	plainButtonTitle: {
		color: "#E5E7EB",
	},
	bookDetailsMore: {
		borderTopColor: "#444444"
	},
	bookDetailsNotesSection: {
		borderTopColor: "#444444"
	},
	bookDetailsDescription: {
		color: "#E5E7EB"
	},
	movieTitle: {
		color: "#FFF"
	},
	movieDescription: {
		marginTop: 20,
		paddingTop: 16,
		paddingLeft: 20,
		paddingRight: 20,
		paddingBottom: 4,
		borderTopWidth: 1,
		borderTopColor: "#444444"
	},
	placeholderTitleText: {
		color: "#E5E7EB"
	},
	placeholderAuthorText: {
		color: "#E5E7EB"
	},
	bookContainer: {
		backgroundColor: '#141723',
		shadowOpacity: 0.75
	},
	discoverView: {
		backgroundColor: '#212936'
	},
	moviesCreditPane: {
		borderTopColor: "#444444",
		backgroundColor: "#272f3d"
	},
	moviesCreditText: {
		color: "#E5E7EB",
		flex: 1,
		flexWrap: "wrap"
	},
	loadingPage: {
		backgroundColor: '#212936'		
	},
	goalsContainer: {
		backgroundColor: '#212936'		
	},
	goalItem: {
		borderBottomColor: "#444444"
	},
	goalName: {
		color: "#FFFFFF"		
	},
	goalProgress: {
		color: "#777777"		
	},
	editGoalTitle: {
		color: "#FFFFFF",
	},
	editGoalDescription: {
		color: "#FFFFFF"
	},
	editGoalInput: {
		color: "#FFFFFF",
		backgroundColor: "#000000"
	},
	editGoalButton: {
		backgroundColor: "#141723"
	},		
	editGoalButtonPressed: {
		backgroundColor: "#000000"
	},
	editGoalButtonTitle: {
		color: "#FFFFFF"
	},
	postTitleField: {
		color: "#FFFFFF"
	},
	postTextNotice: {
		color: "#E5E7EB",
		backgroundColor: "#000000",
		borderBottomColor: "#444444"
	},
	goalsBanner: {
		backgroundColor: "#212936",
		borderBottomColor: "#444444"
	},
	goalsBannerText: {
		color: "#FFFFFF"
	},
	goalsBannerButton: {
		backgroundColor: "#141723"
	},
	goalsBannerButtonTitle: {
		color: "#FFFFFF"		
	},
	signUp: {
		backgroundColor: "#141723"		
	},
	signUpText: {
		color: "#FFF"	
	},
	signUpDescription: {
		color: "#FFF"	
	},
	signUpInput: {
		backgroundColor: "#000",
		color: "#FFF"
	},
	selectedItem: {
		backgroundColor: "#141723"
	},
	openLibraryBanner: {
		borderBottomColor: "#444444"
	},
	openLibraryIntro: {
		color: "#FFFFFF"
	},
	openLibraryUsername: {
		borderColor: "rgba(255, 255, 255, 0.1)",
		color: "#FFF",
		backgroundColor: "#000"
	},
	openLibraryPassword: {
		borderColor: "rgba(255, 255, 255, 0.1)",
		color: "#FFF",
		backgroundColor: "#000"
	},
	openLibraryStatusUsername: {
		color: "#FFFFFF"
	},
	openLibraryStatusButton: {
		color: "#FFFFFF",
		borderRadius: 20
	},
	openLibraryEditionsBar: {
		borderBottomColor: "#444444",
		backgroundColor: "#272f3d"
	},
	openLibraryEditionsTitle: {
		color: "#E5E7EB"
	},
	openLibraryEditionsExtras: {		
		color: "#777777"
	},
	openLibraryEditionsButton: {
		backgroundColor: "#141723"
	},
	openLibraryEditionsButtonTitle: {
		color: "#E5E7EB",
		fontSize: 13
	},
	useThisCoverButton: {
		backgroundColor: "#141723"
	},
	useThisCoverTitle: {
		color: "#FFFFFF"
	},
	notesKeyIntro: {
		color: "#FFFFFF"
	},
	notesKeyLabel: {
		color: "#FFFFFF"
	},
	bookDetailsNotesTitle: {
		color: "#FFFFFF"
	},
	noteCell: {
		borderBottomColor: "#444444"		
	},
	noteCellText: {
		color: "#FFFFFF"
	}
});
