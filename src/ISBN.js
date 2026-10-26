export function normalizedISBN(value) {
	return String(value || "").replace(/[-\s]/g, "");
}

export function isBookISBN(value) {
	const isbn = normalizedISBN(value);
	// 979-0 is reserved for sheet music (ISMN), not book ISBNs.
	if (!/^(978|979)\d{10}$/.test(isbn) || isbn.startsWith("9790")) return false;
	const sum = [...isbn].reduce((total, digit, index) => total + Number(digit) * (index % 2 ? 3 : 1), 0);
	return sum % 10 === 0;
}
