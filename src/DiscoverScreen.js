
import React, { useState } from "react";
import { FlatList, Image, View, TouchableOpacity, Text, RefreshControl, ActivityIndicator, Dimensions, Platform, Share } from 'react-native';
import ContextMenu from "react-native-context-menu-view";
import { InAppBrowser } from 'react-native-inappbrowser-reborn'

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import epilogueStorage from "./Storage";

export function DiscoverScreen({ navigation }) {
		
	const styles = useEpilogueStyle()
	
	const [ data, setData ] = useState()
	const [ refreshing , setRefreshing ] = useState(false)
	const [ loaded, setLoaded ] = useState(false)
	const [ columns, setColumns ] = useState(Platform.isPad ? 5 : 3)
	const [ menuActions, setMenuActions] = useState([])
	
	const height = Platform.isPad ? 260 : 180 // book cover height
	
	// const { id, isbn, title, image, author, description, current_bookshelf, is_search } = route.params;

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

	const BookCover = ({ url, title, author }) => {
		if (url !== '') {
			return (
				<View>
					<Image style={styles.bookCovers} source={{ 
						uri: url
					}}/>
				</View>
			)
		} else {
			return (
				<View>
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
	
	function copyToBookshelf(bookshelf_id) {
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
		
			setProgressAnimating(true);
		
			fetch("https://micro.blog/books", options).then(response => response.json()).then(data => {
				navigation.goBack();
			});
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
	
	return (
		loaded === true ? (
			<View style={styles.discoverView}> 
				<FlatList
					data={data}
					key={columns}
					numColumns={columns}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
					}
					renderItem={({ item }) => (	
						<View style={{flex: 1/columns}}>
							<ContextMenu
								title={item._microblog.book_title}
								onPress={({nativeEvent}) => {
									let shelf_id = nativeEvent.event;									
									if (nativeEvent.name === 'Share') {
										let url = "https://micro.blog/books/" + item._microblog.isbn;
										onShare(url, item._microblog.book_title, item._microblog.book_author);
									}
								}}
								actions={menuActions}
								dropdownMenuMode={false}
							>
								<TouchableOpacity 
									onPress={() => {
										onOpen(item.url);
									}}
									style={ [styles.bookContainer, {height: height}] 
								}>
									<BookCover 
										url={item._microblog.cover_url} 
										title={item._microblog.book_title} 
										author={item._microblog.book_author}
									/>
								</TouchableOpacity>	
							</ContextMenu>
						</View>
					)}
				/>
			</View>
		) : (
			<View style={styles.loadingPage}>
				<ActivityIndicator size='large'/>
			</View>
		)	
	)
}