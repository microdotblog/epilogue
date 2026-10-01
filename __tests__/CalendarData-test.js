import { calendarMonthsFromResponse } from "../src/CalendarData";

it("uses the calendar's grouped months, local finish dates, totals, and backgrounds", () => {
	const months = calendarMonthsFromResponse({ months: [
		{ month_key: "2026-09", year: 2026, month: 9, book_count: 2, page_count: 1315,
			background_url: "https://example.com/background.jpg", books: [
				{ id: 1, title: "Late September", author: "One", finished_date: "2026-09-21", day: 21, page_count: 675 },
				{ id: 3, title: "Early September", isbn: "123", cover_url: "https://example.com/cover.jpg", finished_date: "2026-09-13", day: 13, page_count: 640 }
			] },
		{ month_key: "2026-08", year: 2026, month: 8, book_count: 1, page_count: 400, books: [
			{ id: 2, title: "August", finished_date: "2026-08-07", day: 7, page_count: 400 }
		] }
	] });

	expect(months.map(month => month.key)).toEqual(["2026-09", "2026-08"]);
	expect(months[0].books.map(book => book.id)).toEqual([3, 1]);
	expect(months[0]).toMatchObject({ name: "September", bookCount: 2, pageCount: 1315, backgroundURL: "https://example.com/background.jpg" });
	expect(months[0].books[0]).toMatchObject({ day: 13, date: "2026-09-13", isbn: "123", coverURL: "https://example.com/cover.jpg", pageCount: 640 });
});

it("handles an empty calendar and rejects a non-calendar response", () => {
	expect(calendarMonthsFromResponse({ months: [] })).toEqual([]);
	expect(() => calendarMonthsFromResponse({ items: [] })).toThrow("Invalid book calendar response");
});
