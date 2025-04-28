// Set up side panel (optional check)
if (chrome.sidePanel && chrome.sidePanel.setOptions) {
  chrome.sidePanel
    .setOptions({
      enabled: true,
      path: "src/sidepanel/sidepanel.html"
    })
    .then(() => {
      console.log("Side panel configured successfully");
    })
    .catch(err => {
      console.warn("Side panel configuration failed:", err);
    });
}

// Handle alarms for reminders
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "purchaseReminder") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/eco-bag128.png", // Check that this file exists
      title: "Purchase Reminder",
      message:
        "You wanted to reconsider a purchase. Open the extension to continue shopping or skip.",
      buttons: [{ title: "Open" }]
    });
  }
});

// Handle messages from content script to show modal
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request && request.action === "showModal") {
    const modalWidth = 500;
    const modalHeight = 600;

    const screenWidth = 1366;
    const screenHeight = 768;

    const left = Math.max(0, Math.round((screenWidth - modalWidth) / 2));
    const top = Math.max(0, Math.round((screenHeight - modalHeight) / 2));

    chrome.windows.create(
      {
        url: chrome.runtime.getURL("src/modal/modal.html"),
        type: "popup",
        width: modalWidth,
        height: modalHeight,
        left: left,
        top: top,
        focused: true
      },
      (window) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error creating modal window:",
            chrome.runtime.lastError
          );
        } else {
          console.log("Modal window created:", window.id);
        }
      }
    );
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(function (
  notificationId,
  buttonIndex
) {
  if (buttonIndex === 0) {
    chrome.windows.create({
      url: chrome.runtime.getURL("src/sidepanel/sidepanel.html"),
      type: "popup",
      width: 400,
      height: 600,
      left: 1000,
      top: 100
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    console.log("Side panel opened.");
  } catch (err) {
    console.warn("Failed to open side panel, using fallback.", err);
    chrome.windows.create({
      url: chrome.runtime.getURL("src/sidepanel/sidepanel.html"),
      type: "popup",
      width: 400,
      height: 600,
      left: 1000,
      top: 100
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", message);
  if (message.action === 'closeTab') {
      if (sender.tab) {
          chrome.tabs.remove(sender.tab.id, () => {
              if (chrome.runtime.lastError) {
                  console.error("Error closing tab:", chrome.runtime.lastError);
              } else {
                  console.log(`Tab with ID ${sender.tab.id} closed.`);
              }
          });
      } else {
          // Fallback: Close the active tab
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs.length > 0) {
                  chrome.tabs.remove(tabs[0].id, () => {
                      if (chrome.runtime.lastError) {
                          console.error("Error closing active tab:", chrome.runtime.lastError);
                      } else {
                          console.log(`Active tab with ID ${tabs[0].id} closed.`);
                      }
                  });
              }
          });
      }
  }
});