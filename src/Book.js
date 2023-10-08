import { Edition } from "./models/Edition";

export class Book {	
	constructor(isbn, title, author, cover_url) {
		this.id = "";
		this.description = "";
		this.work_key = "";
		
		this.isbn = isbn;
		this.title = title;
		this.author = author;
		this.cover_url = cover_url;
	}
	
	static isISBN(isbn) {
		let s = isbn.replace("-", "");
		return ((s.length == 13) && s.includes("97"));
	}

	static downloadOpenLibraryEditions(work_key, handler = function(editions) {}) {
		let url = `https://openlibrary.org/works/${work_key}/editions.json`;
		fetch(url).then(response => response.json()).then(data => {
			var results = [];
			
			for (entry of data.entries) {
				let title = entry.title;
				var isbn = "";
				if (entry.isbn_13 != undefined) {
					isbn = entry.isbn_13[0];
				}
				else if (entry.isbn_10 != undefined) {
					isbn = entry.isbn_10[0];
				}
				
				var language = "";
				if (entry.languages != undefined) {
					language = Book.languageFromOpenLibrary(entry.languages[0].key);
				}
				
				var cover_id = 0;
				if (entry.covers != undefined) {
					cover_id = entry.covers[0];
				}
				
				var cover_url = "";
				if (cover_id > 0) {
					cover_url = Book.coverFromOpenLibraryID(cover_id);
				}
				else {
					cover_url = Book.coverFromOpenLibraryISBN(isbn);
				}
		
				let e = new Edition();
				e.id = entry.key;
				e.isbn = isbn;
				e.title = title;
				e.cover_url = cover_url;
				e.cover_id = cover_id;
				e.language = language;
				results.push(e);
			}
		
			handler(results);
		});
	}

	static searchOpenLibrary(query, handler = function(books) {}) {
		let url = "https://openlibrary.org/search.json?q=" + encodeURIComponent(query);
		fetch(url).then(response => response.json()).then(data => {
			var results = [];
			
			for (doc of data.docs) {
				let work_key = doc.key.replace("/works/", "");
				let title = doc.title;
				var author = "";
				if (doc.author_name != undefined) {
					author = doc.author_name[0];
				}
				var isbn = "";
				if (doc.isbn != undefined) {
					isbn = doc.isbn[0];
				}
				let cover_url = Book.coverFromOpenLibraryISBN(isbn);

				let b = new Book(isbn, title, author, cover_url);
				b.id = doc.key;
				b.work_key = work_key;
				results.push(b);
				
				console.log(doc.key);
			}

			handler(results);
		});
	}
	
	static searchGoogleBooks(searchText, handler = function(books) {}) {
		let q = encodeURIComponent(searchText);	
		fetch("https://www.googleapis.com/books/v1/volumes?q=" + q).then(response => response.json()).then(data => {
			var results = [];
			
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
						cover_url = cover_url.replace("http://", "https://");
						cover_url = cover_url.replace("&edge=curl", "");
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
						let b = new Book(best_isbn, book_item.volumeInfo.title, author_name, cover_url);
						b.id = book_item.id;
						b.description = description;
						results.push(b);
					}
				}
			}
			
			handler(results);
		});		
	}
	
	static languageFromOpenLibrary(key) {
		let languages = require("../config/languages.json");
		return languages[key];
	}

	static coverFromOpenLibraryISBN(isbn) {
		let size = "M";
		let cover_url = "https://covers.openlibrary.org/b/isbn/" + isbn + "-" + size + ".jpg";		
		return cover_url;
	}
	
	static coverFromOpenLibraryID(cover_id) {
		let size = "M";
		let cover_url = "https://covers.openlibrary.org/b/id/" + cover_id + "-" + size + ".jpg";		
		return cover_url;
	}
}
