export class Book {	
	constructor(isbn, title, author, cover_url) {
		this.id = "";
		this.description = "";
		
		this.isbn = isbn;
		this.title = title;
		this.author = author;
		this.cover_url = cover_url;
	}
	
	static searchOpenLibrary(isbn, handler = function(books) {}) {
		url = "https://openlibrary.org/search.json?q=" + encodeURIComponent(isbn);
		fetch(url).then(response => response.json()).then(data => {
			var results = [];
			
			for (doc of data.docs) {
				let title = doc.title;
				let author = doc.author_name[0];				
				let size = "M";
				let cover_url = "https://covers.openlibrary.org/b/isbn/" + isbn + "-" + size + ".jpg";
								
				let b = new Book(isbn, title, author, cover_url);
				b.id = doc.key;
				results.push(b);
			}

			handler(results);
		});
	}
	
	static isISBN(isbn) {
		let s = isbn.replace("-", "");
		return ((s.length == 13) && s.includes("97"));
	}
}

