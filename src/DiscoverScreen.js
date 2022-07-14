
import React, { useState } from "react";
import { FlatList, Image, View, TouchableOpacity, Linking, Text, RefreshControl, ActivityIndicator } from 'react-native';

import { keys } from "./Constants";
import { useEpilogueStyle } from './hooks/useEpilogueStyle';
import EpilogueStorage from "./Storage";

export function DiscoverScreen({ navigation }) {
	const styles = useEpilogueStyle()
	
	const [ data, setData ] = useState()
	const [ refreshing , setRefreshing ] = useState(false)
	const [ loaded, setLoaded ] = useState(false)
	
	React.useEffect(() => {
		const unsubscribe = navigation.addListener("focus", () => {
			onFocus(navigation);
		});
		return unsubscribe;
	}, [navigation]);	
	
	const onFocus = (navigation) =>  {
		loadBooks()
	}
	
	async function loadBooks() {
		await fetch("https://micro.blog/posts/discover/books").then(response => response.json()).then(data => {
			setData(data.items)
		})
		console.log('loaded books')
		setLoaded(true)
	}
	
	const onRefresh = React.useCallback(() => {
		setRefreshing(true)
		loadBooks()
		
		setTimeout(() => {
			setRefreshing(false)
		}, 1000)
	}, [])
		
	const BookCover = ({ url, id }) => {
		if (url !== '') {
			return (
				<Image style={styles.bookCovers} source={{ 
					uri: url
				}}/>
			)
		} else {
			return (
				<Text style={styles.placeholderTitleText}>
					Placeholder Book Title{'\n'}
					Post id: {id}
				</Text>
			)
		}
	}
	
	return (
		loaded === true ? (
			<View style={{flex: 1}}> 
				<FlatList
					data={data}
					numColumns={3}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
						/>
					}
					renderItem={({ item }) => (
						<TouchableOpacity onPress={() => Linking.openURL(item.url)} style={styles.bookContainer}>
							<BookCover url={item._microblog.cover_url} id={item.id}/>
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