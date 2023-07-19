
import React, { useState } from "react";
import { TextInput, Pressable, FlatList, Image, View, TouchableOpacity, Text, RefreshControl, ActivityIndicator, Dimensions, Platform, Share, Modal, useWindowDimensions } from 'react-native';
import ContextMenu from "react-native-context-menu-view";
import Clipboard from '@react-native-clipboard/clipboard';
import { InAppBrowser } from 'react-native-inappbrowser-reborn'
import FastImage from "react-native-fast-image";

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";
import { Book } from "./Book";

export function DiscoverScreen({ navigation }) {		
	const styles = useEpilogueStyle();
	const windowSize = useWindowDimensions();
	
	const height = Platform.isPad ? 260 : 180 // book cover height
	
	const [ data, setData ] = useState()
	const [ refreshing , setRefreshing ] = useState(false)
	const [ loaded, setLoaded ] = useState(false)
	const [ searching, setSearching ] = useState(false)
	const [ columns, setColumns ] = useState(bestColumnsForWidth(windowSize.width))
	const [ menuActions, setMenuActions] = useState([])	
	const [ books, setBooks ] = useState()
	const [ itemUpdating, setItemUpdating ] = useState('')
			
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	React.useEffect(() => {
		const subscription = Dimensions.addEventListener("change", ({screen}) => {
			setColumns(bestColumnsForWidth(Dimensions.get("window").width));
		});
		return () => subscription?.remove()
	})
	
	const onFocus = (navigation) =>  {
		loadBooks()
		epilogueStorage.get(keys.allBookshelves).then(bookshelves => {			
			var root_items;
			if (Platform.OS === "ios") {
				var shelf_items = [];
				for (var item of bookshelves) {
					if (item.type != "loans" && item.type != "holds") {
						shelf_items.push({
							id: item.id,
							title: item.title
						});
					}
					
				}

				root_items = [
					{
						id: 'share',
						title: 'Share',
						systemIcon: 'square.and.arrow.up'
					},
					{
						id: 'bookshelves',
						title: 'Bookshelves',
						inlineChildren: true,
						actions: shelf_items
					}
				]
			}
			else {			
				root_items = [
					{
						id: 'share',
						title: 'Share'
					}
				]
				
				for (var item of bookshelves) {
					if (item.type != "loans" && item.type != "holds") {
						root_items.push({
							id: item.id,
							title: item.title
						});
					}
				}				
			}
			
			setMenuActions(root_items)
		});
	}
	
	async function loadBooks() {
		await fetch("https://micro.blog/posts/discover/books").then(response => response.json()).then(data => {
			setData(data.items)
		})
		setLoaded(true)
	}
	
	const onRefresh = React.useCallback(() => {
		setRefreshing(true)
		loadBooks()
		
		setTimeout(() => {
			setRefreshing(false)
		}, 750)
	}, [])
	
	function bestColumnsForWidth(width) {
		var cols = Math.round(width / 150);
		if (cols < 3) {
			cols = 3;
		}

		return cols;
	}
	
	function copyToBookshelf(bookshelf_id, isbn, title, author, image, id) {
		setItemUpdating(id.toString())
		
		let form = new FormData();
		form.append("isbn", isbn);
		form.append("title", title);
		form.append("author", author);
		form.append("cover_url", image);
		form.append("bookshelf_id", bookshelf_id);
		
		epilogueStorage.get("auth_token").then(auth_token => {
			var options = {
				method: "POST",
				body: form,
				headers: {
					"Authorization": "Bearer " + auth_token
				}
			};
		
			// setProgressAnimating(true);
		
			fetch("https://micro.blog/books", options).then(response => response.json()).then(data => {
				console.log("Copied");
			});
			setTimeout(() => {
				setItemUpdating(null)
			}, 1200)
		});
	}
	
	const onShare = async (url, title, author) => {
		try { 
			const result = await Share.share({
				message: title + ' by ' + author,
				url: url,
			})
			if (result.action === Share.sharedAction) {
				if (result.activityType) {
					switch (result.activityType) {
						case 'com.apple.UIKit.activity.CopyToPasteboard':
							Clipboard.setString(url)
							break
					}
				} else {	
					
				}
			} else if (result.action === Share.dismissedAction) {
				
			}
		} catch (error) {
			alert(error.message)
		}
	}
	
	const onOpen = async (url) => {
		let result = await InAppBrowser.open(url, {
			animated: true
		});
	}

	const onCopyToBookshelfName = async (bookshelf_name, book_item) => {
		epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
			var found_bookshelf;
			for (var item of bookshelves) {
				if (item.title == bookshelf_name) {
					found_bookshelf = item;
					break;
				}
			}
			
			if (found_bookshelf != undefined) {
				copyToBookshelf(found_bookshelf.id, book_item._microblog.isbn, book_item._microblog.book_title, book_item._microblog.book_author, book_item._microblog.cover_url, book_item.id);
			}
		});
	}

	function onShowBookPressed(item) {
		epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
			epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
				var params = {
					id: item.id,
					isbn: item.isbn,
					title: item.title,
					image: item.image,
					author: item.author,
					description: item.description,
					bookshelves: bookshelves,
					current_bookshelf: current_bookshelf,
					is_search: item.is_search
				};
				navigation.navigate("Details", params);
			});
		});
	}
	
	function onChangeSearch(text) {		
		// if we're clearing the text, wait a second and then send it
		// otherwise the user is still typing
		if (text.length == 0) {
			setTimeout(function() {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
						setSearching(false);
						setBooks([]);
					});				
				});
			}, 500);
		}
		else {
			epilogueStorage.set(keys.currentSearch, text);
		}
	}
	
	function onRunSearch() {
		epilogueStorage.get(keys.currentSearch).then(search_text => {
			let s = String(search_text);
			if ((s != "null") && (s.length > 0)) {
				setSearching(true);
				sendSearch(search_text);
			}
			else {
				epilogueStorage.remove(keys.currentSearch).then(() => {
					epilogueStorage.get(keys.currentBookshelf).then(current_bookshelf => {
						setSearching(false);
						setBooks([]);
					});				
				});
			}
		});
	}

	function sendSearch(searchText) {
		if (Book.isISBN(searchText)) {
			Book.searchOpenLibrary(searchText, function(new_books) {				
				if (new_books.length > 0) {				
					var new_items = [];
	
					for (b of new_books) {
						new_items.push({
							id: b.id,
							isbn: b.isbn,
							title: b.title,
							image: b.cover_url,
							author: b.author,
							description: b.description,
							is_search: true
						});
					}
	
					setBooks(new_items);
				}
				else {
					Book.searchGoogleBooks(searchText, function(new_books) {
						var new_items = [];
					
						for (b of new_books) {
							new_items.push({
								id: b.id,
								isbn: b.isbn,
								title: b.title,
								image: b.cover_url,
								author: b.author,
								description: b.description,
								is_search: true
							});
						}
						
						setBooks(new_items);
					});
				}
				
			});
		}
		else {		
			Book.searchGoogleBooks(searchText, function(new_books) {
				var new_items = [];
			
				for (b of new_books) {
					new_items.push({
						id: b.id,
						isbn: b.isbn,
						title: b.title,
						image: b.cover_url,
						author: b.author,
						description: b.description,
						is_search: true
					});
				}
				
				setBooks(new_items);
			});
		}
	}

	const BookCover = ({ url, title, author, id }) => {
		if (url !== '') {
			return (
				<FastImage style={styles.bookCovers} source={{ 
					uri: url
				}}/>
			)
		} else {
			return (
				<View >
					<Text style={styles.placeholderTitleText}>
						{title}
					</Text>
					<Text style={styles.placeholderAuthorText}>
						{author}
					</Text>
				</View>
			)
		}
	}
	
	const renderItem =({item}) => (
		<View style={{flex: 1/columns}}>
			<ContextMenu
				title={item._microblog.book_title}
				onPress={({nativeEvent}) => {
					// let shelf_id = nativeEvent.event;
					if (nativeEvent.name === 'Share') {
						let url = "https://micro.blog/books/" + item._microblog.isbn;
						onShare(url, item._microblog.book_title, item._microblog.book_author);
					}
					else {
						onCopyToBookshelfName(nativeEvent.name, item);
					}
				}}
				actions={menuActions}
				dropdownMenuMode={false}
			>

				<TouchableOpacity 
					onPress={() => { onOpen(item.url) }}
					onLongPress={() => { return null }}
					style={ [styles.bookContainer, {height: height}] }>
					
					<View style={[styles.addingBookSpinner, {opacity: itemUpdating === item.id.toString() ? 0.5 : 0.0, backgroundColor: itemUpdating === item.id.toString() ? '#111' : null, zIndex: itemUpdating === item.id.toString() ? 5 : 0}]}>
						<ActivityIndicator color={'#fff'} animating={itemUpdating===item.id.toString()} hidesWhenStopped={true}/>
					</View>
					
					<BookCover 
						url={item._microblog.cover_url} 
						title={item._microblog.book_title} 
						author={item._microblog.book_author}
						id={item.id}
					/>	
				</TouchableOpacity>	
			</ContextMenu>
		</View>
	)


	const renderSearchItem = ({item}) => (
		<Pressable onPress={() => { onShowBookPressed(item) }}>
			<View style={styles.item}>
				<FastImage style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
				<View style={styles.bookItem}>
					<Text style={styles.bookTitle} ellipsizeMode="tail" numberOfLines={2}>{item.title}</Text>
					<Text style={styles.bookAuthor}>{item.author}</Text>
				</View>
			</View>
		</Pressable>
	);
	
	return (
		loaded === true ? (
			searching === true ? (
				<View style={styles.discoverView}> 
					<TextInput style={styles.searchField} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for books to add" clearButtonMode="always" />
					<FlatList
						data = {books}
						key = "BooksList"
						renderItem = {renderSearchItem}
						keyExtractor = { item => item.id }
					/>
				</View>
			) : (
				<View style={styles.discoverView}> 
					<TextInput style={styles.searchField} onChangeText={onChangeSearch} onEndEditing={onRunSearch} returnKeyType="search" placeholder="Search for books to add" clearButtonMode="always" />
					<FlatList
						data={data}
						key={columns}
						keyExtractor={(item) => item.id.toString()}
						numColumns={columns}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
						}
						renderItem={renderItem}
					/>
				</View>
			)
		) : (
			<View style={styles.loadingPage}>
				<ActivityIndicator size='large'/>
			</View>
		)	
	)
}