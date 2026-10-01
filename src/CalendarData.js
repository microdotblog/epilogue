const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function calendarMonthsFromFinishedFeed(feed, now = new Date()) {
	const cutoff = new Date(now);
	cutoff.setMonth(cutoff.getMonth() - 24);
	const months = new Map();

	for (const item of feed.items || []) {
		const finishedAt = new Date(item.date_published);
		if (Number.isNaN(finishedAt.getTime()) || finishedAt < cutoff || finishedAt > now) continue;

		const year = finishedAt.getFullYear();
		const month = finishedAt.getMonth();
		const key = `${year}-${String(month + 1).padStart(2, "0")}`;
		if (!months.has(key)) {
			months.set(key, { key, year, month, name: monthNames[month], books: [], backgroundURL: "", backgroundColor: "#8f9697" });
		}
		const group = months.get(key);
		const metadata = item._microblog || {};
		group.books.push({
			id: item.id,
			isbn: metadata.isbn || "",
			title: item.title || "Untitled book",
			author: item.authors?.[0]?.name || "",
			coverURL: item.image || "",
			description: item.content_text || "",
			day: finishedAt.getDate(),
			date: item.date_published,
			backgroundURL: metadata.background_url || "",
			backgroundColor: metadata.background_color || "",
			authorID: metadata.author_id
		});
		if (!group.backgroundURL && metadata.background_url) {
			group.backgroundURL = metadata.background_url;
			if (metadata.background_color) group.backgroundColor = metadata.background_color;
		}
		if (group.backgroundColor === "#8f9697" && metadata.background_color) group.backgroundColor = metadata.background_color;
	}

	return Array.from(months.values()).sort((a, b) => b.key.localeCompare(a.key)).map(month => ({
		...month,
		books: month.books.sort((a, b) => a.day - b.day)
	}));
}
