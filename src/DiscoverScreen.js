
import React, { useState } from "react";
import { FlatList, Image, View, TouchableOpacity, Linking, Text, RefreshControl, ActivityIndicator, Dimensions, Platform, Modal, Share, Pressable } from 'react-native';
import { MenuView } from "@react-native-menu/menu";

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import EpilogueStorage from "./Storage";

export function DiscoverScreen({ navigation }) {
		
	const styles = useEpilogueStyle()
	
	const [ data, setData ] = useState()
	const [ refreshing , setRefreshing ] = useState(false)
	const [ loaded, setLoaded ] = useState(false)
	const [ columns, setColumns ] = useState(Platform.isPad ? 5 : 3)
	
	const [ modalVisible, setModalVisible ] = useState(false)
	const [ modalTitle, setModalTitle ] = useState()
	const [ modalAuthor, setModalAuthor ] = useState()
	const [ modalUri, setModalUri ] = useState()
	
	const [ shareUrl, setShareUrl ] = useState('testurl')
	
	const height = Platform.isPad ? 260 : 180 // book cover height
		
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
	
	const BookInfoModal = ({ author, title, uri }) => {
		return (
			<Modal animationType='slide' transparent={true} visible={modalVisible} 
				onRequestClose={() => {
					setModalVisible(!modalVisible)
				}}>
				<View style={{justifyContent: 'center', flex: 1, alignItems: 'center', width: 300, alignSelf: 'center'}}>
					<View style={{padding: 25, backgroundColor: 'white', alignItems: 'center', borderRadius: 15, shadowColor: '#000', shadowOffset: { height: 2}, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }}>
						<Image style={styles.bookCoverModal} source={{uri: uri}}/>
						<Text style={styles.placeholderTitleText}>{title}</Text>
						<Text style={styles.placeholderAuthorText}>{author}</Text>
						
						<TouchableOpacity style={{padding: 10, borderRadius: 10, backgroundColor: 'lightgray'}}>
							<Text style={{}}>Add to Want to Read</Text>
						</TouchableOpacity>
						
						<Pressable style={{padding: 10, borderRadius: 10}} onPress={() => setModalVisible(!modalVisible)}>
							<Text style={{color: 'red'}}>Close</Text>
						</Pressable>
					</View>
				</View>
			</Modal>
		)
	}
	
	const openBookInfoModal = (title, author, uri) => {
		setModalVisible(!modalVisible)
		setModalTitle(title)
		setModalAuthor(author)
		setModalUri(uri)
	}
	
	const onShare = async () => {
		try { 
			const result = await Share.share({
				message: '(title) by (author)',
				url: shareUrl,
			})
			if (result.action === Share.sharedAction) {
				if (result.activityType) {
					
				} else {
					
				}
			} else if (result.action === Share.dismissedAction) {
				setShareUrl('')
			}
		} catch (error) {
			alert(error.message)
		}
	}
	
	const BookInfoMenu = (title, author, uri) => {
		
		return (
			<MenuView
				title={modalTitle}
				onPressAction={({nativeEvent}) => {
					console.warn(JSON.stringify(nativeEvent))
					switch (nativeEvent.event) {
						case 'share':
							onShare()
							break
						case 'wantToRead':
							console.log('want to read')
							break
						case 'currentlyReading':
							console.log('currentlyReading')
							break
						case 'finishedReading':
							console.log('finished reading')
							break
					}
				}}
				actions={[
					{
						id: 'share',
						title: 'Share',
						titleColor: '#000',
						subtitle: 'Share action on SNS',
						image: Platform.select({
						  ios: 'square.and.arrow.up',
						  android: 'ic_menu_share',
						}),
						imageColor: '#000',
					},
					{
						id: 'add',
						title: 'Add to List',
						titleColor: '#000',
						subactions: [
							{
								id: 'wantToRead',
								title: 'Want to Read',
								image: Platform.select({
									ios: 'plus',
									android: 'ic_menu_add'
								}),
							},
							{
								id: 'currentlyReading',
								title: 'Currently Reading',
								image: Platform.select({
									ios: 'plus',
									android: 'ic_menu_add'
								}),		
							},
							{
								id: 'finishedReading',
								title: 'Finished Reading',
								image: Platform.select({
									ios: 'plus',
									android: 'ic_menu_add'
								})
							}
						]
					}
				]}
				shouldOpenOnLongPress={true}
			>
				<View>
					<Text>test</Text>
				</View>
			</MenuView>
		)
	}
	
	return (
		loaded === true ? (
			<View style={styles.discoverView}> 
			
				<BookInfoModal title={modalTitle} author={modalAuthor} uri={modalUri}/>
				
				<BookInfoMenu title={modalTitle} author={modalAuthor} uri={modalUri}/>
				
				<FlatList
					data={data}
					key={columns}
					numColumns={columns}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
					}
					renderItem={({ item }) => (	
						<View style={{flex: 1/columns}}>
							<TouchableOpacity 
								onPress={() => Linking.openURL(item.url)}
								onLongPress={() => openBookInfoModal(item._microblog.book_title, item._microblog.book_author, item._microblog.cover_url)} 
								style={ [styles.bookContainer, {height: height}] }>
									<BookCover 
										url={item._microblog.cover_url} 
										title={item._microblog.book_title} 
										author={item._microblog.book_author}
									/>
							</TouchableOpacity>	
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