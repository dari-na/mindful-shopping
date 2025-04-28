export function saveDecision(event) {

	chrome.storage.local.get({decisions: []}, (data) => {
		const updated = [...data.decisions, event];
		chrome.storage.local.set({decisions: updated}, () => {
			console.log("✅ Decision saved:", event);
		});
	});
}

export function getDecisions(callback) {
	chrome.storage.local.get({decisions: []}, (data) => {
		callback(data.decisions);
		console.log("📦 Decisions retrieved:", data.decisions);
	});
}

export function clearDecisions(callback) {
	chrome.storage.local.set({decisions: []}, () => {
		console.log("🧹 Decisions cleared.");
		if (callback) callback();
	});
}