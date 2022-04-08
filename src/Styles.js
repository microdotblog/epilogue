import { StyleSheet } from "react-native";

export const light = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 10
	},
	profileIcon: {
		width: 24,
		height: 24,
		borderRadius: 12
	},
	navbarBookshelf: {
		flexDirection: "row",
	},
	navbarBookshelfIcon: {
		color: "#337AB7",
		marginRight: 8,
	},
	navbarBookshelfTitle: {
		color: "#337AB7",
	},
	item: {
		flexDirection: "row",
		height: 90,
		marginLeft: 20,
		marginRight: 20,
		paddingBottom: 10
	},
	bookItem: {
		flex: 1
	},
	bookTitle: {
		marginTop: 8,
		paddingLeft: 7
	},
	bookAuthor: {
		paddingTop: 4,
		paddingLeft: 7,
		color: "#777777"
	},
	bookCover: {
		width: 50,
		height: 70
	},
	bookDetails: {
		alignItems: "center",
		marginTop: 5,
		marginBottom: 20,
		paddingBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#DEDEDE"
	},
	bookDetailsCover: {
		width: 200,
		height: 200,
		resizeMode: "contain"
	},
	bookDetailsTitle: {
		marginTop: 10
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
		width: 25,
		height: 25,
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
		marginBottom: 15,
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
		padding: 20,
		backgroundColor: "white"
	},
	signInHeader: {
		flexDirection: "row",
		marginBottom: 20,
	},
	signInTextHeader: {
		flex: 1,
		fontSize: 16,
	},
	signInImage: {
		width: 50,
		height: 50,
		marginTop: 15,
		marginLeft: 5,
		marginRight: 15,
	},
	signInText: {
		fontSize: 16,
		marginBottom: 20,
	},
	signInInput: {
		borderStyle: 'solid',
		borderColor: "rgba(0, 0, 0, 0.20)",
		borderWidth: 1,
		borderRadius: 4,
		padding: 10,
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
		marginLeft: 10,
		backgroundColor: "#DEDEDE"
	},
	profileUsername: {
		marginLeft: 10
	},
	micropubPane: {
		flexDirection: "row",
		alignItems: "center",
		marginLeft: 10,
		marginTop: 12
	},
	micropubButton: {
		marginLeft: 12,
		paddingLeft: 8,
		paddingRight: 8,
		paddingTop: 4,
		paddingBottom: 4,
		borderRadius: 5,
		backgroundColor: "#DEDEDE"
	},
	micropubButtonTitle: {		
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
	bookDetailsDescription: {		
	},
	bookDetailsNoDescription: {		
	},
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
		backgroundColor: "#000000"
	},
	signInText: {
		color: "#E5E7EB"
	},
	signInTextHeader: {
		color: "#E5E7EB"
	},
	signInInput: {
		borderColor: "rgba(255, 255, 255, 0.20)",
		color: "#FFF"
	},
	profilePane: {
		borderBottomColor: "#444444"
	},
	profileUsername: {
		color: "#E5E7EB"
	},
	micropubHostname: {
		color: "#E5E7EB"
	},
	micropubButton: {
		backgroundColor: "#141723"
	},
	micropubButtonTitle: {
		color: "#E5E7EB"
	},
	micropubIntro: {
		color: "#E5E7EB"
	},
	micropubURL: {
		color: "#E5E7EB"
	},
	bookDetailsMore: {
		borderTopColor: "#444444"
	},
	bookDetailsDescription: {
		color: "#E5E7EB"
	}
});
