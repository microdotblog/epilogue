
import React, { useState } from "react";
import { TextInput, Pressable, FlatList, Image, View, TouchableOpacity, Text, RefreshControl, ActivityIndicator, Dimensions, Platform, Share, Modal } from 'react-native';
import ContextMenu from "react-native-context-menu-view";
import Clipboard from '@react-native-clipboard/clipboard';
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function DiscoverScreen({ navigation }) {
		
	const styles = useEpilogueStyle()
	
	const height = Platform.isPad ? 260 : 180 // book cover height
	
	const [ data, setData ] = useState()
	const [ refreshing , setRefreshing ] = useState(false)
	const [ loaded, setLoaded ] = useState(false)
	const [ searching, setSearching ] = useState(false)
	const [ columns, setColumns ] = useState(Platform.isPad ? 5 : 3)
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
		const subscription = Dimensions.addEventListener(
			'change',
			({screen}) => {
				if (Platform.isPad) setColumns(isPortrait() ? 5 : 6)
			}
		)	
		return () => subscription?.remove()
	})
	
	const onFocus = (navigation) =>  {
		loadBooks()
		epilogueStorage.get(keys.allBookshelves).then(bookshelves => {
			var shelf_items = [];
			for (var item of bookshelves) {
				shelf_items.push({
					id: item.id,
					title: item.title
				});
			}
			var root_items = [
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
		}, 1000)
	}, [])
	
	const isPortrait = () => {
		const dimensions = Dimensions.get('screen')
		return dimensions.height >= dimensions.width
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
			if ((search_text != null) && (search_text.length > 0)) {
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
		let q = encodeURIComponent(searchText);
	
		var options = {
		};
		
		fetch("https://www.googleapis.com/books/v1/volumes?q=" + q, options).then(response => response.json()).then(data => {
			var new_items = [];
			if (data.items != undefined) {
				for (let book_item of data.items) {
					var author_name = "";
					var description = "";
					
					if ((book_item.volumeInfo.authors != undefined) && (book_item.volumeInfo.authors.length > 0)) {
						author_name = book_item.volumeInfo.authors[0];
					}
	
					if (book_item.volumeInfo.description != undefined) {
						description = book_item.volumeInfo.description;
					}
	
					var cover_url = "";
					if (book_item.volumeInfo.imageLinks != undefined) {
						cover_url = book_item.volumeInfo.imageLinks.smallThumbnail;
						if (cover_url.includes("http://")) {
							cover_url = cover_url.replace("http://", "https://");
						}					
					}
	
					let isbns = book_item.volumeInfo.industryIdentifiers;
					var best_isbn = "";
					if (isbns != undefined) {
						for (let isbn of isbns) {
							if (isbn.type == "ISBN_13") {
								best_isbn = isbn.identifier;
								break;
							}
							else if (isbn.type == "ISBN_10") {
								best_isbn = isbn.identifier;
							}
						}
					}
	
					if ((best_isbn.length > 0) && (cover_url.length > 0)) {
						new_items.push({
							id: book_item.id,
							isbn: best_isbn,
							title: book_item.volumeInfo.title,
							image: cover_url,
							author: author_name,
							description: description,
							is_search: true
						});
					}
				}
			}
			
			setBooks(new_items);
		});
	}
		
	const BookCover = ({ url, title, author, id }) => {
		if (url !== '') {
			return (
				<Image style={styles.bookCovers} source={{ 
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
				<Image style={styles.bookCover} source={{ uri: item.image.replace("http://", "https://") }} />
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