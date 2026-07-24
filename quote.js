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

const quoteForm =
    document.getElementById("quoteForm");

const quoteButton =
    document.getElementById("quoteSubmitButton");

const copyQuoteButton =
    document.getElementById("copyQuoteButton");

const quoteStatus =
    document.getElementById("quoteStatus");

const businessPhone = "7257240012";


/*
   This page is public.

   Signed-in customers receive automatic name and email
   completion. Signed-out visitors can still use the form.
*/

onAuthStateChanged(auth, (user) => {
    if (!user) {
        return;
    }

    const nameInput =
        document.getElementById("fullName");

    const emailInput =
        document.getElementById("email");


    if (
        nameInput &&
        !nameInput.value &&
        user.displayName
    ) {
        nameInput.value =
            user.displayName;
    }


    if (
        emailInput &&
        !emailInput.value &&
        user.email
    ) {
        emailInput.value =
            user.email;
    }
});


function showStatus(
    message,
    isError = false
) {
    quoteStatus.textContent =
        message;

    quoteStatus.classList.toggle(
        "error",
        isError
    );

    quoteStatus.classList.toggle(
        "success",
        !isError && Boolean(message)
    );
}


function getValue(id) {
    return (
        document
            .getElementById(id)
            ?.value
            .trim() || ""
    );
}


function buildQuoteMessage() {
    return [
        "Packaged Comfort Quote Request",
        "",
        `Name: ${getValue("fullName")}`,
        `Phone: ${getValue("phone")}`,
        `Email: ${getValue("email")}`,
        `Preferred date: ${getValue("serviceDate")}`,
        `Service: ${getValue("service")}`,
        `Amount: ${getValue("amount")}`,
        `Pickup: ${getValue("pickup")}`,
        `Destination: ${getValue("destination")}`,
        `Details: ${getValue("details") || "None provided"}`,
        "",
        "I can attach item photos in this message if needed."
    ].join("\n");
}


function isLikelyMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent
    );
}


async function copyRequestDetails() {
    if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return false;
    }

    const message =
        buildQuoteMessage();

    try {
        await navigator.clipboard.writeText(
            message
        );

        showStatus(
            "Your quote request details were copied."
        );

        return true;
    } catch (error) {
        console.error(
            "Copy request error:",
            error
        );

        showStatus(
            "The request could not be copied automatically. Please call or text 725-724-0012.",
            true
        );

        return false;
    }
}


copyQuoteButton.addEventListener(
    "click",
    async () => {
        copyQuoteButton.disabled = true;
        copyQuoteButton.textContent =
            "Copying...";

        await copyRequestDetails();

        copyQuoteButton.disabled = false;
        copyQuoteButton.textContent =
            "Copy Request Details";
    }
);


quoteForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        if (!quoteForm.checkValidity()) {
            quoteForm.reportValidity();
            return;
        }

        quoteButton.disabled = true;
        quoteButton.textContent =
            "Preparing Request...";

        showStatus("");

        const message =
            buildQuoteMessage();

        const smsLink =
            `sms:${businessPhone}?body=${encodeURIComponent(message)}`;


        try {
            if (isLikelyMobileDevice()) {
                showStatus(
                    "Your request is ready. Review the message and tap send."
                );

                window.location.href =
                    smsLink;
            } else {
                const copied =
                    await copyRequestDetails();

                if (copied) {
                    showStatus(
                        "Your request was copied. Text it to 725-724-0012, or open this page on your phone."
                    );
                }
            }
        } catch (error) {
            console.error(
                "Quote request error:",
                error
            );

            showStatus(
                "Please call or text 725-724-0012 to complete your request.",
                true
            );
        } finally {
            window.setTimeout(() => {
                quoteButton.disabled = false;

                quoteButton.textContent =
                    "Prepare Quote Request";
            }, 700);
        }
    }
);
