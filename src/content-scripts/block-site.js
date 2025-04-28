

// Helper function to normalize hostnames
function normalizeHostname(hostname) {
    return hostname.replace(/^www\./, '');
}

function getSiteHost() {
    return new URL(window.location.href).host;
}

// Main blocking logic
(function () {
    console.log("⛔ block-site.js is running on", window.location.hostname);

    chrome.storage.local.get({ blockedSites: {} }, (data) => {
        const blockedSites = data.blockedSites;
        const now = Date.now();
        const siteUrl = window.location.hostname;

        console.log("Blocked Sites:", blockedSites);
        console.log("Current Site URL:", siteUrl);

        if (blockedSites[siteUrl] && now < blockedSites[siteUrl]) {
           //blovking overlay
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(26, 35, 33, 0.97)';
                overlay.style.zIndex = '999999';
                overlay.style.display = 'flex';
                overlay.style.flexDirection = 'column';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.innerHTML = `
                    <h1 style="font-size: 2rem; color: #ffffff; text-align: center;">
                        The site is <span style="color: #a20d00;">blocked</span> for <span style="color: #a20d00;">24h</span>.<br>
                        Take some time to think about whether to make this purchase.
                    </h1>
                    ,<br>
                    <h3 style="font-size: 1.5rem; color: #ffffff; text-align: center; text-transform: none;">
                        Visit the sidepanel to view and manage your blocked sites.
                    </h3>
                `;
                document.body.appendChild(overlay);
            
        } else if (blockedSites[siteUrl]) {
            // Remove expired block
            delete blockedSites[siteUrl];
            chrome.storage.local.set({ blockedSites });
        }
    });
})();

// Function to update the blocked sites list
function updateBlockedSitesList() {
    console.log("🔄 Updating blocked sites list...");
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