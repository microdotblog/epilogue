import { StyleSheet } from "react-native";

export default StyleSheet.create({
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
		marginTop: 4
	},
	navbarBookshelfIcon: {
		width: 25,
		height: 25,
		tintColor: "#337AB7",
	},
	navbarBookshelfTitle: {
		paddingTop: 5,
		paddingLeft: 5,
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
		backgroundColor: "#DEDEDE",
		pressed: {
			backgroundColor: "#BBBBBB",
		}
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
		marginTop: 1,
		marginBottom: 15,
		marginLeft: 20,
		marginRight: 20,
		paddingTop: 7,
		paddingBottom: 7,
		paddingLeft: 12,
		paddingRight: 12,
		borderRadius: 20,
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
		fontSize: 16
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
	signinIntro: {
		marginTop: 5,
		marginLeft: 15,
		marginRight: 15
	},
	signinEmail: {
		marginTop: 15,
		marginLeft: 15,
		marginRight: 15
	},
	signinAppleSection: {
		opacity: 0,
		marginTop: 15,
		paddingTop: 15,
		borderTopWidth: 1,
		borderTopColor: "#DEDEDE"
	},
	signinAppleIntro: {
		marginLeft: 15,
		marginRight: 15	
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
	dark: {
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
			borderColor: "#555b64",
			color: "#FFFFFF"
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
			backgroundColor: "#141723",
			pressed: {
				backgroundColor: "#000000"
			}
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
		signinIntro: {
			color: "#E5E7EB"
		},
		signinEmail: {
			color: "#E5E7EB"
		},
		signinAppleIntro: {
			color: "#E5E7EB"
		}
	}
});
