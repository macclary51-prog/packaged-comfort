import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const firebaseConfig = {
    apiKey: "AIzaSyDMWaronfPi0cujdvzGIsieadLss_d4iMQ",
    authDomain: "packaged-comfort-website.firebaseapp.com",
    projectId: "packaged-comfort-website",
    storageBucket: "packaged-comfort-website.firebasestorage.app",
    messagingSenderId: "150317110708",
    appId: "1:150317110708:web:dab83f056b04b1e0210ee1"
};


const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);

const auth = getAuth(app);


addAccountMenuStyles();


function addAccountMenuStyles() {
    if (document.getElementById("firebaseAccountMenuStyles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "firebaseAccountMenuStyles";

    style.textContent = `
        .firebase-account-menu {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .firebase-account-name {
            display: inline-flex;
            min-height: 44px;
            align-items: center;
            border-radius: 10px;
            padding: 8px 13px;
            background: #fff1e9;
            color: #17233b;
            font-weight: 800;
            text-decoration: none;
        }

        .firebase-account-name strong {
            margin-left: 4px;
            color: #ee6c2f;
        }

        .firebase-logout-button {
            border: 1px solid #17233b;
            border-radius: 10px;
            padding: 11px 16px;
            background: transparent;
            color: #17233b;
            font: inherit;
            font-weight: 800;
            cursor: pointer;
        }

        .firebase-logout-button:hover {
            background: #17233b;
            color: white;
        }

        .firebase-auth-hidden {
            display: none !important;
        }

        @media (max-width: 980px) {
            .firebase-account-menu {
                width: 100%;
                align-items: stretch;
                flex-direction: column;
                margin-top: 8px;
                padding-top: 12px;
                border-top: 1px solid #d9dde5;
            }

            .firebase-account-name,
            .firebase-logout-button {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);
}


function getCustomerName(user) {
    const savedName = user.displayName?.trim();

    if (savedName) {
        return savedName.split(/\s+/)[0];
    }

    if (user.email) {
        return user.email.split("@")[0];
    }

    return "Customer";
}


function getNavigation() {
    return (
        document.getElementById("mainNav") ||
        document.querySelector(".main-nav")
    );
}


function getGuestNavigationSections() {
    const markedGuestSections =
        Array.from(document.querySelectorAll("[data-auth-guest]"));

    if (markedGuestSections.length > 0) {
        return markedGuestSections;
    }

    const navigation = getNavigation();

    if (!navigation) {
        return [];
    }

    const navActions =
        Array.from(navigation.querySelectorAll(".nav-actions"));

    if (navActions.length > 0) {
        return navActions;
    }

    return Array.from(
        navigation.querySelectorAll(
            'a[href="login.html"], a[href="signup.html"]'
        )
    );
}


function removeGeneratedAccountMenu() {
    document
        .querySelectorAll(".firebase-account-menu")
        .forEach((menu) => menu.remove());
}


function showSignedOutNavigation() {
    getGuestNavigationSections().forEach((element) => {
        element.classList.remove("firebase-auth-hidden");
    });

    document
        .querySelectorAll("[data-auth-user]")
        .forEach((element) => {
            element.classList.add("firebase-auth-hidden");
        });

    removeGeneratedAccountMenu();
}


function showSignedInNavigation(user) {
    const customerName = getCustomerName(user);

    getGuestNavigationSections().forEach((element) => {
        element.classList.add("firebase-auth-hidden");
    });

    document
        .querySelectorAll("[data-user-name], [data-dashboard-name]")
        .forEach((element) => {
            element.textContent = customerName;
        });

    const existingUserSections =
        document.querySelectorAll("[data-auth-user]");

    if (existingUserSections.length > 0) {
        existingUserSections.forEach((element) => {
            element.classList.remove(
                "hidden",
                "firebase-auth-hidden"
            );
        });

        existingUserSections
            .forEach((section) => connectExistingLogoutButtons(section));

        return;
    }

    const navigation = getNavigation();

    if (!navigation) {
        return;
    }

    removeGeneratedAccountMenu();

    const accountMenu = document.createElement("div");
    accountMenu.className = "firebase-account-menu";

    const accountLink = document.createElement("a");
    accountLink.className = "firebase-account-name";
    accountLink.href = "dashboard.html";

    accountLink.append(
        document.createTextNode("Hi, ")
    );

    const nameText = document.createElement("strong");
    nameText.textContent = customerName;

    accountLink.appendChild(nameText);

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "firebase-logout-button";
    logoutButton.textContent = "Log Out";

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        logoutButton.textContent = "Logging Out...";

        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            console.error("Firebase logout error:", error);

            logoutButton.disabled = false;
            logoutButton.textContent = "Log Out";
        }
    });

    accountMenu.append(
        accountLink,
        logoutButton
    );

    navigation.appendChild(accountMenu);
}


function connectExistingLogoutButtons(section) {
    section
        .querySelectorAll("[data-logout]")
        .forEach((button) => {
            if (button.dataset.logoutConnected === "true") {
                return;
            }

            button.dataset.logoutConnected = "true";

            button.addEventListener("click", async () => {
                button.disabled = true;
                button.textContent = "Logging Out...";

                try {
                    await signOut(auth);
                    window.location.href = "index.html";
                } catch (error) {
                    console.error("Firebase logout error:", error);

                    button.disabled = false;
                    button.textContent = "Log Out";
                }
            });
        });
}


onAuthStateChanged(auth, (user) => {
    if (user) {
        showSignedInNavigation(user);
    } else {
        showSignedOutNavigation();
    }
});
