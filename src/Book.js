export class Book {	
	constructor(isbn, title, author, cover_url) {
		this.id = "";
		this.description = "";
		
		this.isbn = isbn;
		this.title = title;
		this.author = author;
		this.cover_url = cover_url;
	}
	
	static isISBN(isbn) {
		let s = isbn.replace("-", "");
		return ((s.length == 13) && s.includes("97"));
	}

	static searchOpenLibrary(query, handler = function(books) {}) {
		url = "https://openlibrary.org/search.json?q=" + encodeURIComponent(query);
		fetch(url).then(response => response.json()).then(data => {
			var results = [];
			
			for (doc of data.docs) {
				let title = doc.title;
				var author = "";
				if (doc.author_name != undefined) {
					author = doc.author_name[0];
				}
				var isbn = "";
				if (doc.isbn != undefined) {
					isbn = doc.isbn[0];
				}
				let size = "M";
				let cover_url = "https://covers.openlibrary.org/b/isbn/" + isbn + "-" + size + ".jpg";

				let b = new Book(isbn, title, author, cover_url);
				b.id = doc.key;
				results.push(b);
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
}

