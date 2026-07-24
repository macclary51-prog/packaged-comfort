import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const accountServiceConfig = {
    apiKey: "AIzaSyDMWaronfPi0cujdvzGIsieadLss_d4iMQ",
    authDomain: "packaged-comfort-website.firebaseapp.com",
    projectId: "packaged-comfort-website",
    storageBucket: "packaged-comfort-website.firebasestorage.app",
    messagingSenderId: "150317110708",
    appId: "1:150317110708:web:dab83f056b04b1e0210ee1"
};


const app = getApps().length
    ? getApp()
    : initializeApp(accountServiceConfig);

const auth = getAuth(app);

const quoteForm = document.getElementById("quoteForm");
const quoteButton = document.getElementById("quoteSubmitButton");
const quoteStatus = document.getElementById("quoteStatus");

const businessPhone = "7257240012";


onAuthStateChanged(auth, (user) => {
    if (!user) {
        return;
    }

    const nameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");

    if (nameInput && !nameInput.value && user.displayName) {
        nameInput.value = user.displayName;
    }

    if (emailInput && !emailInput.value && user.email) {
        emailInput.value = user.email;
    }
});


function showStatus(message, isError = false) {
    quoteStatus.textContent = message;
    quoteStatus.classList.toggle("error", isError);
    quoteStatus.classList.toggle("success", !isError && Boolean(message));
}


function valueOf(id) {
    return document.getElementById(id)?.value.trim() || "";
}


function buildQuoteMessage() {
    const lines = [
        "Packaged Comfort Quote Request",
        "",
        `Name: ${valueOf("fullName")}`,
        `Phone: ${valueOf("phone")}`,
        `Email: ${valueOf("email")}`,
        `Preferred date: ${valueOf("serviceDate")}`,
        `Service: ${valueOf("service")}`,
        `Amount: ${valueOf("amount")}`,
        `Pickup: ${valueOf("pickup")}`,
        `Destination: ${valueOf("destination")}`,
        `Details: ${valueOf("details") || "None provided"}`,
        "",
        "I can attach item photos in this message if needed."
    ];

    return lines.join("\n");
}


function isLikelyMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent
    );
}


quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
    }

    quoteButton.disabled = true;
    quoteButton.textContent = "Preparing Request...";
    showStatus("");

    const message = buildQuoteMessage();
    const smsLink = `sms:${businessPhone}?body=${encodeURIComponent(message)}`;

    try {
        if (isLikelyMobileDevice()) {
            showStatus(
                "Your message is ready. Review it and tap send."
            );

            window.location.href = smsLink;
        } else {
            await navigator.clipboard.writeText(message);

            showStatus(
                "Your request details were copied. Text them to 725-724-0012, or use your phone to submit from this page."
            );
        }
    } catch (error) {
        console.error("Quote preparation error:", error);

        showStatus(
            "Please call or text 725-724-0012 to complete your quote request.",
            true
        );
    } finally {
        window.setTimeout(() => {
            quoteButton.disabled = false;
            quoteButton.textContent = "Continue to Text Message";
        }, 900);
    }
});
