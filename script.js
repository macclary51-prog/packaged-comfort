"use strict";


/* ========================================
   Packaged Comfort
   Shared Website JavaScript
======================================== */


/* ========================================
   MOBILE NAVIGATION
======================================== */

const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");


if (menuButton && mainNav) {
    menuButton.addEventListener("click", () => {
        const menuIsOpen =
            mainNav.classList.toggle("open");

        menuButton.setAttribute(
            "aria-expanded",
            String(menuIsOpen)
        );

        menuButton.textContent =
            menuIsOpen ? "×" : "☰";
    });


    mainNav
        .querySelectorAll("a")
        .forEach((link) => {
            link.addEventListener("click", () => {
                closeMobileMenu();
            });
        });


    document.addEventListener("click", (event) => {
        const clickedInsideMenu =
            mainNav.contains(event.target) ||
            menuButton.contains(event.target);

        if (!clickedInsideMenu) {
            closeMobileMenu();
        }
    });
}


function closeMobileMenu() {
    if (!menuButton || !mainNav) {
        return;
    }

    mainNav.classList.remove("open");

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    menuButton.textContent = "☰";
}


/* ========================================
   CURRENT YEAR
======================================== */

document
    .querySelectorAll("[data-current-year]")
    .forEach((element) => {
        element.textContent =
            new Date().getFullYear();
    });


/* ========================================
   TOAST MESSAGES
======================================== */

const toast = document.getElementById("toast");
const toastMessage =
    document.getElementById("toastMessage");

let toastTimer;


function showToast(message) {
    if (!toast || !toastMessage) {
        return;
    }

    window.clearTimeout(toastTimer);

    toastMessage.textContent = message;
    toast.classList.add("show");

    toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 4200);
}


/* ========================================
   TEMPORARY DEMO FORMS
======================================== */

document
    .querySelectorAll("[data-demo-form]")
    .forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            showToast(
                "This form will work after its Firebase feature is connected."
            );
        });
    });


/* ========================================
   QUOTE PHOTO PREVIEWS
======================================== */

const photoInput =
    document.getElementById("movingPhotos");

const photoPreview =
    document.getElementById("photoPreview");

let selectedPhotos = [];


if (photoInput && photoPreview) {
    photoInput.addEventListener(
        "change",
        (event) => {
            const incomingFiles =
                Array.from(event.target.files);

            const imageFiles =
                incomingFiles.filter((file) => {
                    return file.type.startsWith(
                        "image/"
                    );
                });

            const spacesRemaining =
                12 - selectedPhotos.length;

            selectedPhotos = [
                ...selectedPhotos,
                ...imageFiles.slice(
                    0,
                    spacesRemaining
                )
            ];

            renderPhotoPreview();

            photoInput.value = "";
        }
    );
}


function renderPhotoPreview() {
    if (!photoPreview) {
        return;
    }

    photoPreview.innerHTML = "";

    selectedPhotos.forEach((file, index) => {
        const previewItem =
            document.createElement("div");

        previewItem.className =
            "preview-item";

        const image =
            document.createElement("img");

        image.alt =
            `Selected item photo ${index + 1}`;

        const objectUrl =
            URL.createObjectURL(file);

        image.src = objectUrl;

        image.addEventListener(
            "load",
            () => {
                URL.revokeObjectURL(
                    objectUrl
                );
            },
            { once: true }
        );

        const removeButton =
            document.createElement("button");

        removeButton.type = "button";
        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            `Remove photo ${index + 1}`
        );

        removeButton.addEventListener(
            "click",
            () => {
                selectedPhotos.splice(
                    index,
                    1
                );

                renderPhotoPreview();
            }
        );

        previewItem.append(
            image,
            removeButton
        );

        photoPreview.appendChild(
            previewItem
        );
    });
}


/* ========================================
   PREVENT PAST SERVICE DATES
======================================== */

const serviceDateInput =
    document.getElementById("serviceDate");


if (serviceDateInput) {
    const now = new Date();

    const localToday = new Date(
        now.getTime() -
        now.getTimezoneOffset() * 60000
    )
        .toISOString()
        .split("T")[0];

    serviceDateInput.min = localToday;
}


/* ========================================
   FIREBASE ACCOUNT NAVIGATION
======================================== */

const firebaseConfig = {
    apiKey:
        "AIzaSyDMWaronfPi0cujdvzGIsieadLss_d4iMQ",

    authDomain:
        "packaged-comfort-website.firebaseapp.com",

    projectId:
        "packaged-comfort-website",

    storageBucket:
        "packaged-comfort-website.firebasestorage.app",

    messagingSenderId:
        "150317110708",

    appId:
        "1:150317110708:web:dab83f056b04b1e0210ee1"
};


loadFirebaseAccountNavigation();


async function loadFirebaseAccountNavigation() {
    try {
        const firebaseAppModule = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"
        );

        const firebaseAuthModule = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
        );


        const {
            initializeApp,
            getApp,
            getApps
        } = firebaseAppModule;


        const {
            getAuth,
            onAuthStateChanged,
            signOut
        } = firebaseAuthModule;


        const app =
            getApps().length > 0
                ? getApp()
                : initializeApp(firebaseConfig);


        const auth = getAuth(app);


        addFirebaseNavigationStyles();


        onAuthStateChanged(
            auth,
            (user) => {
                if (user) {
                    showLoggedInNavigation(
                        user,
                        auth,
                        signOut
                    );
                } else {
                    showLoggedOutNavigation();
                }
            }
        );

    } catch (error) {
        console.error(
            "Firebase navigation could not load:",
            error
        );
    }
}


/* ========================================
   GET CUSTOMER NAME
======================================== */

function getCustomerName(user) {
    if (
        user.displayName &&
        user.displayName.trim()
    ) {
        return user.displayName
            .trim()
            .split(/\s+/)[0];
    }


    if (user.email) {
        return user.email.split("@")[0];
    }


    return "Customer";
}


/* ========================================
   FIND WEBSITE NAVIGATION
======================================== */

function getWebsiteNavigation() {
    return (
        document.getElementById("mainNav") ||
        document.querySelector(".main-nav")
    );
}


/* ========================================
   FIND LOGIN AND SIGNUP BUTTONS
======================================== */

function getGuestNavigationElements() {
    const navigation =
        getWebsiteNavigation();


    if (!navigation) {
        return [];
    }


    const markedGuestSections =
        Array.from(
            navigation.querySelectorAll(
                "[data-auth-guest]"
            )
        );


    if (markedGuestSections.length > 0) {
        return markedGuestSections;
    }


    const navActionSections =
        Array.from(
            navigation.querySelectorAll(
                ".nav-actions"
            )
        );


    if (navActionSections.length > 0) {
        return navActionSections;
    }


    return Array.from(
        navigation.querySelectorAll(
            'a[href="login.html"], ' +
            'a[href="signup.html"]'
        )
    );
}


/* ========================================
   LOGGED-OUT NAVIGATION
======================================== */

function showLoggedOutNavigation() {
    getGuestNavigationElements()
        .forEach((element) => {
            element.classList.remove(
                "firebase-auth-hidden"
            );
        });


    document
        .querySelectorAll(
            ".firebase-dashboard-link"
        )
        .forEach((link) => {
            link.remove();
        });


    document
        .querySelectorAll(
            ".firebase-account-menu"
        )
        .forEach((menu) => {
            menu.remove();
        });


    document
        .querySelectorAll(
            "[data-auth-user]"
        )
        .forEach((element) => {
            element.classList.add(
                "firebase-auth-hidden"
            );
        });
}


/* ========================================
   LOGGED-IN NAVIGATION
======================================== */

function showLoggedInNavigation(
    user,
    auth,
    signOut
) {
    const customerName =
        getCustomerName(user);


    getGuestNavigationElements()
        .forEach((element) => {
            element.classList.add(
                "firebase-auth-hidden"
            );
        });


    createDashboardNavigationLink();


    document
        .querySelectorAll(
            "[data-user-name], " +
            "[data-dashboard-name]"
        )
        .forEach((element) => {
            element.textContent =
                customerName;
        });


    document
        .querySelectorAll(
            ".user-greeting, " +
            ".firebase-account-name"
        )
        .forEach((link) => {
            link.href = "settings.html";
            link.setAttribute(
                "aria-label",
                "Open account settings"
            );
        });


    const existingUserSections =
        document.querySelectorAll(
            "[data-auth-user]"
        );


    if (existingUserSections.length > 0) {
        existingUserSections.forEach(
            (section) => {
                section.classList.remove(
                    "hidden",
                    "firebase-auth-hidden"
                );


                connectExistingLogoutButtons(
                    section,
                    auth,
                    signOut
                );
            }
        );

        return;
    }


    createAccountMenu(
        customerName,
        auth,
        signOut
    );
}


/* ========================================
   CREATE DASHBOARD LINK
======================================== */

function createDashboardNavigationLink() {
    const navigation =
        getWebsiteNavigation();


    if (!navigation) {
        return;
    }


    const existingDashboardLink =
        navigation.querySelector(
            ".firebase-dashboard-link"
        );


    if (existingDashboardLink) {
        return;
    }


    const dashboardLink =
        document.createElement("a");


    dashboardLink.href =
        "dashboard.html";


    dashboardLink.textContent =
        "Dashboard";


    dashboardLink.className =
        "firebase-dashboard-link";


    const firstActionSection =
        navigation.querySelector(
            ".nav-actions, " +
            "[data-auth-guest], " +
            "[data-auth-user], " +
            ".firebase-account-menu"
        );


    if (firstActionSection) {
        navigation.insertBefore(
            dashboardLink,
            firstActionSection
        );
    } else {
        navigation.appendChild(
            dashboardLink
        );
    }


    dashboardLink.addEventListener(
        "click",
        () => {
            closeMobileMenu();
        }
    );
}


/* ========================================
   CREATE ACCOUNT MENU
======================================== */

function createAccountMenu(
    customerName,
    auth,
    signOut
) {
    const navigation =
        getWebsiteNavigation();


    if (!navigation) {
        return;
    }


    document
        .querySelectorAll(
            ".firebase-account-menu"
        )
        .forEach((menu) => {
            menu.remove();
        });


    const accountMenu =
        document.createElement("div");

    accountMenu.className =
        "firebase-account-menu";


    const accountLink =
        document.createElement("a");

    accountLink.className =
        "firebase-account-name";

    accountLink.href =
        "settings.html";

    accountLink.setAttribute(
        "aria-label",
        "Open account settings"
    );


    accountLink.append(
        document.createTextNode("Hi, ")
    );


    const nameText =
        document.createElement("strong");

    nameText.textContent =
        customerName;


    accountLink.appendChild(
        nameText
    );


    const logoutButton =
        document.createElement("button");

    logoutButton.type = "button";

    logoutButton.className =
        "firebase-logout-button";

    logoutButton.textContent =
        "Log Out";


    logoutButton.addEventListener(
        "click",
        async () => {
            logoutButton.disabled = true;

            logoutButton.textContent =
                "Logging Out...";


            try {
                await signOut(auth);

                window.location.href =
                    "index.html";

            } catch (error) {
                console.error(
                    "Firebase logout error:",
                    error
                );

                logoutButton.disabled = false;

                logoutButton.textContent =
                    "Log Out";
            }
        }
    );


    accountMenu.append(
        accountLink,
        logoutButton
    );


    navigation.appendChild(
        accountMenu
    );
}


/* ========================================
   EXISTING LOGOUT BUTTONS
======================================== */

function connectExistingLogoutButtons(
    section,
    auth,
    signOut
) {
    section
        .querySelectorAll("[data-logout]")
        .forEach((button) => {

            if (
                button.dataset
                    .logoutConnected === "true"
            ) {
                return;
            }


            button.dataset.logoutConnected =
                "true";


            button.addEventListener(
                "click",
                async () => {
                    button.disabled = true;

                    button.textContent =
                        "Logging Out...";


                    try {
                        await signOut(auth);

                        window.location.href =
                            "index.html";

                    } catch (error) {
                        console.error(
                            "Firebase logout error:",
                            error
                        );

                        button.disabled = false;

                        button.textContent =
                            "Log Out";
                    }
                }
            );
        });
}


/* ========================================
   ACCOUNT MENU STYLES
======================================== */

function addFirebaseNavigationStyles() {
    if (
        document.getElementById(
            "firebaseAccountMenuStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "firebaseAccountMenuStyles";


    style.textContent = `
        .firebase-auth-hidden {
            display: none !important;
        }

        .firebase-dashboard-link {
            display: inline-flex;
            align-items: center;
        }

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
            min-height: 44px;
            border: 1px solid #17233b;
            border-radius: 10px;
            padding: 10px 16px;
            background: transparent;
            color: #17233b;
            font-family: inherit;
            font-size: inherit;
            font-weight: 800;
            cursor: pointer;
        }

        .firebase-logout-button:hover {
            background: #17233b;
            color: white;
        }

        .firebase-logout-button:disabled {
            cursor: wait;
            opacity: 0.7;
        }

        @media (max-width: 980px) {
            .firebase-dashboard-link {
                width: 100%;
            }

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


    document.head.appendChild(
        style
    );
}
