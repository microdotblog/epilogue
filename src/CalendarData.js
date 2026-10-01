const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function calendarMonthsFromResponse(response) {
	if (!Array.isArray(response?.months)) throw new Error("Invalid book calendar response");

	return response.months.map(month => ({
		key: month.month_key,
		year: month.year,
		name: monthNames[month.month - 1],
		bookCount: month.book_count,
		pageCount: month.page_count,
		backgroundURL: month.background_url || "",
		books: (month.books || []).map(book => ({
			id: book.id,
			isbn: book.isbn || "",
			title: book.title || "Untitled book",
			author: book.author || "",
			coverURL: book.cover_url || "",
			description: book.description || "",
			day: book.day,
			date: book.finished_date,
			pageCount: book.page_count,
			backgroundURL: book.background_url || "",
			backgroundColor: book.background_color || ""
		})).sort((a, b) => a.day - b.day)
	}));
}
