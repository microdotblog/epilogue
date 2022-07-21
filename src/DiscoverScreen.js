
import React, { useState } from "react";
import { FlatList, Image, View, TouchableOpacity, Linking, Text, RefreshControl, ActivityIndicator, Dimensions, Platform } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import EpilogueStorage from "./Storage";

export function DiscoverScreen({ navigation }) {
	const styles = useEpilogueStyle()
	
	const [ data, setData ] = useState()
	const [ refreshing , setRefreshing ] = useState(false)
	const [ loaded, setLoaded ] = useState(false)
	const [ orientation, setOrientation ] = useState('portrait')
	const [ columns, setColumns ] = useState(Platform.isPad ? 5 : 3)
	const [ height, setHeight ] = useState(Platform.isPad ? 200 : 140) // book cover height
		
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
				setOrientation(isPortrait() ? 'portrait' : 'landscape')
				if (Platform.isPad) setColumns(isPortrait() ? 5 : 7)
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
	
	return (
		loaded === true ? (
			<View style={{flex: 1}}> 
				<FlatList
					data={data}
					key={columns}
					numColumns={columns}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
						/>
					}
					renderItem={({ item }) => (
						<TouchableOpacity onPress={() => Linking.openURL(item.url)} 
							style={ [styles.bookContainer, {height: height}, {flex: 1/columns}] }>
							<BookCover 
								url={item._microblog.cover_url} 
								title={item._microblog.book_title} 
								author={item._microblog.book_author}
							/>
						</TouchableOpacity>	
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