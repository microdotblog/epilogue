
import React, { useState } from "react";
import { FlatList, Image, View, TouchableOpacity, Text, RefreshControl, ActivityIndicator, Dimensions, Platform, Share, Modal } from 'react-native';
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
	const [ columns, setColumns ] = useState(Platform.isPad ? 5 : 3)
	const [ menuActions, setMenuActions] = useState([])
	
	const [ itemUpdating, setItemUpdating ] = useState('')
	
	const [ adding, setAdding ] = useState(true)
		
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
		var d1 = new Date()
		setItemUpdating(id.toString())
		console.log(id + ' updating')
		
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
				var d2 = new Date()
				console.log(id + ' finished adding in ' + ((d2 - d1) - 1500) + 'ms')
			}, 1500)
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
	
	const BookCover = ({ url, title, author, id }) => {
		if (url !== '') {
			return (
				<Image style={styles.bookCovers} source={{ 
					uri: url
				}}/>
			)
		} else {
			return (
				<View style={{alignContent: 'center', justifyContent: 'center', zIndex: 3, flex: 1, backgroundColor: itemUpdating === id.toString() ? 'lightgray' : null}}>
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
					
					<View style={{flex: 1, opacity: itemUpdating === item.id.toString() ? 0.5 : 0.0, backgroundColor: itemUpdating === item.id.toString() ? '#111' : null , position: 'absolute', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', zIndex: itemUpdating === item.id.toString() ? 5 : 0}}>
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
	
	return (
		loaded === true ? (
			<View style={styles.discoverView}> 
				<FlatList
					data={data}
					extraData={data}
					// key={columns}
					keyExtractor={(item) => item.id.toString()}
					numColumns={columns}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
					}
					renderItem={renderItem}
				/>
			</View>
		) : (
			<View style={styles.loadingPage}>
				<ActivityIndicator size='large'/>
			</View>
		)	
	)
}