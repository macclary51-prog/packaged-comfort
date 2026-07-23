import { auth } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const guestSections = document.querySelectorAll("[data-auth-guest]");
const userSections = document.querySelectorAll("[data-auth-user]");
const userNameElements = document.querySelectorAll("[data-user-name]");
const dashboardNameElements =
    document.querySelectorAll("[data-dashboard-name]");
const logoutButtons = document.querySelectorAll("[data-logout]");

const authRequired =
    document.body.dataset.authRequired === "true";


function getDisplayName(user) {
    if (user.displayName && user.displayName.trim()) {
        return user.displayName.trim().split(" ")[0];
    }

    if (user.email) {
        return user.email.split("@")[0];
    }

    return "Customer";
}


function showSignedOutNavigation() {
    guestSections.forEach((section) => {
        section.classList.remove("hidden");
    });

    userSections.forEach((section) => {
        section.classList.add("hidden");
    });
}


function showSignedInNavigation(user) {
    const displayName = getDisplayName(user);

    guestSections.forEach((section) => {
        section.classList.add("hidden");
    });

    userSections.forEach((section) => {
        section.classList.remove("hidden");
    });

    userNameElements.forEach((element) => {
        element.textContent = displayName;
    });

    dashboardNameElements.forEach((element) => {
        element.textContent = displayName;
    });
}


onAuthStateChanged(auth, (user) => {
    if (user) {
        showSignedInNavigation(user);
        return;
    }

    showSignedOutNavigation();

    if (authRequired) {
        const destination =
            encodeURIComponent(window.location.pathname);

        window.location.replace(
            `login.html?redirect=${destination}`
        );
    }
});


logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
        button.disabled = true;
        button.textContent = "Logging Out...";

        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Logout failed:", error);
            button.disabled = false;
            button.textContent = "Log Out";
        }
    });
});
