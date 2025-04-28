// src/content-scripts/checkout-detector.js

let originalCheckoutButton = null;

function detectCheckoutButtons() {
	console.log("🔍 detectCheckoutButtons is running");

	const checkoutSelectors = [
		'input[name="proceedToRetailCheckout"]',
		'input[value*="Proceed to checkout"]',
		'a[href*="checkout"]',
		'button[id*="checkout"]',
		'a[id*="checkout"]',
		'button[class*="checkout"]',
		'a[class*="checkout"]',
		'button.j-cart-check',
		'div.j-checkout-btn',
		'input[name="checkout"][value="Check out"]',
		'button[aria-label="Go to checkout"]', 
    	'button[data-id="proceed-to-checkout-button"]'
	];

	const selector = checkoutSelectors.join(", ");
	const checkoutButtons = document.querySelectorAll(selector);

	checkoutButtons.forEach((button) => {
		if (!button.classList.contains('mindful-checkout-bound')) {
			console.log("🧠 Replacing button to block native handlers:", button);

			const clone = button.cloneNode(true);
			clone.classList.add('mindful-checkout-bound');

			clone.addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();

				originalCheckoutButton = button; // Save the real button
				injectModal();
			});

			button.replaceWith(clone);
		}
	});
}

function getEstimatedPrice() {
	const retailNode = document.querySelector('.bsc-cart-item-discount-cell .bsc-cart-item-discount-cell__right-price');
	if (!retailNode) return null;

	const promoNodes = document.querySelectorAll('.bsc-cart-item-discount-dropdown span');
	let retailPrice = parseFloat(retailNode.textContent.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
	let totalDiscount = 0;

	promoNodes.forEach(node => {
		const value = parseFloat(node.textContent.replace(/[^\d.,-]/g, '').replace(',', '.'));
		if (!isNaN(value)) {
			totalDiscount += value; // Already negative
		}
	});

	const finalPrice = retailPrice + totalDiscount;
	return `${finalPrice.toFixed(2)}`;

}

function injectModal() {
	if (document.getElementById("purchase-impact-modal-overlay")) {
		return;
	}
	const siteHost = window.location.hostname;

	const estimatedPrice = getEstimatedPrice();
	console.log("💸 Calculated Estimated Price:", estimatedPrice);

	const iframe = document.createElement("iframe");
	iframe.src = `chrome-extension://${chrome.runtime.id}/src/modal/modal.html`;
	iframe.id = "purchase-impact-modal-content";
	iframe.style.width = "480px";
	iframe.style.height = "auto";
	iframe.style.maxHeight = "95vh";
	iframe.style.borderRadius = "20px";
	iframe.style.boxShadow = "0 16px 40px rgba(0,0,0,0.2)";
	iframe.style.overflow = "hidden";
	iframe.style.transition = "height 0.2s ease";
	iframe.setAttribute("scrolling", "no");

	const overlay = document.createElement("div");
	overlay.id = "purchase-impact-modal-overlay";
	overlay.style.position = "fixed";
	overlay.style.top = "0";
	overlay.style.left = "0";
	overlay.style.width = "100%";
	overlay.style.height = "100%";
	overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
	overlay.style.display = "flex";
	overlay.style.justifyContent = "center";
	overlay.style.alignItems = "center";
	overlay.style.zIndex = "999999";

	overlay.appendChild(iframe);
	document.body.appendChild(overlay);

	overlay.addEventListener("click", function (event) {
		if (event.target === overlay) {
			closeModal();
		}
	});

	document.body.style.overflow = "hidden";

	iframe.onload = () => {
		iframe.contentWindow.postMessage(
			{action: "setEstimatedPrice", price: estimatedPrice},
			"*"
		);

		iframe.contentWindow.postMessage(
			{ action: "setSiteHost", siteHost }, // Pass the hostname to the modal
			"*"
		);
	};
}

function closeModal() {
	console.log("⛔ closeModal called");
	const overlay = document.getElementById("purchase-impact-modal-overlay");
	if (overlay) {
		document.body.removeChild(overlay);
		document.body.style.overflow = "";
	}
}

window.addEventListener("message", function (event) {

	if (event.data.action === "resizeModal") {
		const iframe = document.getElementById("purchase-impact-modal-content");
		if (iframe) {
			iframe.style.height = event.data.height + "px";
		}
	} else if (event.data.action === "closeModal") {
		console.log("User chose to close the modal.");
		closeModal();
	} else if (event.data.action === "continueCheckout") {
		if (originalCheckoutButton) {
			console.log("🔁 Re-triggering original checkout button");
			originalCheckoutButton.click();
			originalCheckoutButton = null; // Clean up
		} else {
			console.warn("⚠️ No original button found. Falling back to page reload.");
			window.location.reload();
		}
	}
});

document.addEventListener("DOMContentLoaded", detectCheckoutButtons);
setInterval(detectCheckoutButtons, 2000);
