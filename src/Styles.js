import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
	flex: 1,
	marginTop: 10
  },
  profileIcon: {
	width: 24,
	height: 24,
	borderBottomLeftRadius: 12,
	borderBottomRightRadius: 12,
	borderTopRightRadius: 12,
	borderTopLeftRadius: 12    
  },
  navbarBookshelf: {
	flexDirection: "row",
	marginTop: 4
  },
  navbarBookshelfIcon: {
	width: 25,
	height: 25,
	tintColor: "#337AB7"
  },
  navbarBookshelfTitle: {
	paddingTop: 3,
	paddingLeft: 5,
	color: "#337AB7"
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
	marginBottom: 6
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
  }
});
