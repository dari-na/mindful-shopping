import {getDecisions, clearDecisions} from '../utils/storage.js';

document.addEventListener("DOMContentLoaded", () => {
	const moneyEl = document.querySelector(".stat-card.purple .value");
	const co2El = document.querySelector(".stat-card.green .value");
	const waterEl = document.querySelector(".stat-card.blue .value");
	const skippedEl = document.querySelector(".stat-card.yellow .value");
	const progressFill = document.querySelector(".progress-fill");
	const progressLabel = document.querySelector(".progress-label");
	
	getDecisions((decisions) => {
		console.log("Decisions retrieved:", decisions);

		const skipped = decisions.filter(d => d.choice === "skip");
		const total = decisions.length;

		const totals = skipped.reduce((acc, entry) => {
			acc.amount += parseFloat(entry.amount) || 0;
			acc.co2 += parseFloat(entry.co2) || 0;
			acc.water += parseFloat(entry.water) || 0;
			return acc;
		}, {amount: 0, co2: 0, water: 0});

		const skipRate = total > 0 ? Math.round((skipped.length / total) * 100) : 0;

		// Update stats
		moneyEl.textContent = `${totals.amount.toFixed(2)}`;

		const trees = Math.max(1, Math.round(totals.co2 / 10));
		co2El.textContent = `${totals.co2.toFixed(1)} kg`;
		document.querySelector(".stat-card.green .description").textContent = `Equivalent to planting ${trees} tree${trees === 1 ? '' : 's'}`;


		const showers = Math.round(totals.water / 60);
		waterEl.textContent = `${totals.water.toFixed(0)} L`;
		document.querySelector(".stat-card.blue .description").textContent = `Equivalent to ${showers} shower${showers === 1 ? '' : 's'}`;

		const now = new Date();
		const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
		const recentSkipped = skipped.filter(entry => new Date(entry.timestamp) > thirtyDaysAgo);
		skippedEl.textContent = recentSkipped.length;

		// Update insights
		if (progressFill) progressFill.style.width = `${skipRate}%`;
		if (progressLabel) {
			const message = skipRate > 60 ? "Great progress!" : "Keep going!";
			progressLabel.innerHTML = `${skipRate}% of considered purchases were skipped <span class="success">${message}</span>`;
		}
	});

	console.log("MoneyEl: " + moneyEl);
	console.log("CO2El: " + co2El);
	console.log("WaterEl: " + waterEl);
	console.log("SkippedEl: " + skippedEl);
	console.log("ProgressFill: " + progressFill);
	console.log("ProgressLabel: " + progressLabel);
});

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const views = document.querySelectorAll('.view');

    // Tab switching logic
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and views
            tabs.forEach((t) => t.classList.remove('active'));
            views.forEach((view) => view.classList.remove('active'));

            // Add active class to the clicked tab and corresponding view
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Initial update of the blocked sites list
    updateBlockedSitesList();

	setInterval(updateBlockedSitesList, 30 * 1000);
});

// Function to update the blocked sites list
function updateBlockedSitesList() {
    console.log("🔄 SP Updating blocked sites list...");
    chrome.storage.local.get({ blockedSites: {} }, (data) => {
        const blockedSites = data.blockedSites;
        const now = Date.now();

        const blockedListElement = document.getElementById('blocked-sites-list');
        blockedListElement.innerHTML = ''; // Clear the list

        for (const [site, blockUntil] of Object.entries(blockedSites)) {
            if (now >= blockUntil) {
                // Remove expired blocks
                delete blockedSites[site];
            } else {
                const listItem = document.createElement('li');
                const remainingMinutes = Math.ceil((blockUntil - now) / (60 * 1000)); // Remaining time in minutes
                const hours = Math.floor(remainingMinutes / 60);
                const minutes = remainingMinutes % 60;

                // Format the time string
                let timeString = '';
                if (hours > 0) {
                    timeString += `${hours}h`;
                }
                if (minutes > 0) {
                    if (hours > 0) {
                        timeString += ' and ';
                    }
                    timeString += `${minutes}m`;
                }

                listItem.innerHTML = `
                    <span>${site} - Blocked for ${timeString || '0m'} more</span>
                    <button class="unblock-btn" data-site="${site}">Unblock</button>
                `;

                blockedListElement.appendChild(listItem);
            }
        }

        // Save the updated blockedSites object
        chrome.storage.local.set({ blockedSites });

        // Add event listeners to "Unblock" buttons
        document.querySelectorAll('.unblock-btn').forEach((button) => {
            button.addEventListener('click', (event) => {
                const site = event.target.dataset.site;
                unblockSite(site);
            });
        });
    });
}

// Function to unblock a site
function unblockSite(site) {
    chrome.storage.local.get({ blockedSites: {} }, (data) => {
        const blockedSites = data.blockedSites;
        delete blockedSites[site]; // Remove the site from the blocked list
        chrome.storage.local.set({ blockedSites }, () => {
            console.log(`Site "${site}" unblocked.`);
            updateBlockedSitesList(); // Refresh the UI
        });
    });
}
