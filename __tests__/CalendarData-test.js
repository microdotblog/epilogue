import { calendarMonthsFromFinishedFeed } from "../src/CalendarData";

const now = new Date("2026-10-01T12:00:00Z");

it("groups finished shelf books by month, newest month first and earliest day first", () => {
	const months = calendarMonthsFromFinishedFeed({ items: [
		{ id: 1, title: "Late September", date_published: "2026-09-21T12:00:00Z", authors: [{ name: "One" }], _microblog: { background_color: "#123456" } },
		{ id: 2, title: "August", date_published: "2026-08-07T12:00:00Z" },
		{ id: 3, title: "Early September", date_published: "2026-09-13T12:00:00Z", image: "https://example.com/cover.jpg", _microblog: { isbn: "123", background_url: "https://example.com/background.jpg", background_color: "#ABCDEF" } },
		{ id: 4, title: "Too old", date_published: "2022-01-01T12:00:00Z" },
		{ id: 5, title: "No date" }
	] }, now);

	expect(months.map(month => month.key)).toEqual(["2026-09", "2026-08"]);
	expect(months[0].books.map(book => book.id)).toEqual([3, 1]);
	expect(months[0]).toMatchObject({ name: "September", backgroundColor: "#ABCDEF", backgroundURL: "https://example.com/background.jpg" });
	expect(months[0].books[0]).toMatchObject({ day: 13, isbn: "123", coverURL: "https://example.com/cover.jpg" });
});

it("handles an empty feed", () => {
	expect(calendarMonthsFromFinishedFeed({ items: [] }, now)).toEqual([]);
});
