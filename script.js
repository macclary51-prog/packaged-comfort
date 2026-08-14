"use strict";


/* ========================================
   MOBILE NAVIGATION
======================================== */

const menuButton =
    document.getElementById("menuButton");

const mainNav =
    document.getElementById("mainNav");


if (menuButton && mainNav) {
    menuButton.addEventListener(
        "click",
        () => {
            const isOpen =
                mainNav.classList.toggle("open");

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            menuButton.textContent =
                isOpen ? "×" : "☰";
        }
    );


    mainNav
        .querySelectorAll("a")
        .forEach((link) => {
            link.addEventListener(
                "click",
                closeMobileMenu
            );
        });


    document.addEventListener(
        "click",
        (event) => {
            const clickedInside =
                mainNav.contains(event.target) ||
                menuButton.contains(event.target);

            if (!clickedInside) {
                closeMobileMenu();
            }
        }
    );
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

    menuButton.textContent =
        "☰";
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
   PREVENT PAST SERVICE DATES
======================================== */

const serviceDateInput =
    document.getElementById("serviceDate");


if (serviceDateInput) {
    const now =
        new Date();

    const localToday =
        new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        )
            .toISOString()
            .split("T")[0];

    serviceDateInput.min =
        localToday;
}


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
            const imageFiles =
                Array
                    .from(event.target.files)
                    .filter((file) => {
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

    selectedPhotos.forEach(
        (file, index) => {
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

            image.src =
                objectUrl;

            image.addEventListener(
                "load",
                () => {
                    URL.revokeObjectURL(
                        objectUrl
                    );
                },
                {
                    once: true
                }
            );

            const removeButton =
                document.createElement("button");

            removeButton.type =
                "button";

            removeButton.textContent =
                "×";

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
        }
    );
}


/* ========================================
   ACCOUNT-AWARE NAVIGATION
======================================== */

loadAccountNavigation();


async function loadAccountNavigation() {
    const navigation =
        document.getElementById("mainNav") ||
        document.querySelector(".main-nav");

    if (!navigation) {
        return;
    }

    try {
        const {
            auth,
            db
        } = await import(
            "./firebase-config.js?v=31"
        );

        const {
            onAuthStateChanged,
            signOut
        } = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
        );

        const {
            doc,
            getDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"
        );


        addAccountNavigationStyles();


        onAuthStateChanged(
            auth,
            async (user) => {
                removeGeneratedAccountNavigation();

                if (!user) {
                    showGuestNavigation();
                    return;
                }

                let isAdmin =
                    user.uid === "lE77uZp22tbjptd1k9Nt89eOdW12"
                    ||
                    String(user.email || "")
                        .trim()
                        .toLowerCase() === "pcmovers01@gmail.com";

                let roleName =
                    isAdmin
                        ? "Franklin"
                        : "";

                try {
                    const roleSnapshot =
                        await getDoc(
                            doc(
                                db,
                                "roles",
                                user.uid
                            )
                        );

                    if (roleSnapshot.exists()) {
                        const roleData =
                            roleSnapshot.data();

                        const firestoreAdmin =
                            String(roleData.role || "")
                                .trim()
                                .toLowerCase() === "admin"
                            &&
                            roleData.active === true;

                        isAdmin =
                            isAdmin || firestoreAdmin;

                        if (!roleName) {
                            roleName =
                                String(roleData.name || "")
                                    .trim();
                        }
                    }

                } catch (error) {
                    console.error(
                        "Navigation role check failed:",
                        error
                    );
                }

                hideGuestNavigation();

                createAccountNavigation({
                    user,
                    isAdmin,
                    roleName,
                    auth,
                    signOut,
                    navigation
                });
            }
        );

    } catch (error) {
        console.error(
            "Account navigation could not load:",
            error
        );
    }
}


function getGuestNavigationElements() {
    const navigation =
        document.getElementById("mainNav") ||
        document.querySelector(".main-nav");

    if (!navigation) {
        return [];
    }

    const marked =
        Array.from(
            navigation.querySelectorAll(
                "[data-auth-guest]"
            )
        );

    if (marked.length > 0) {
        return marked;
    }

    const actions =
        Array.from(
            navigation.querySelectorAll(
                ".nav-actions"
            )
        );

    if (actions.length > 0) {
        return actions;
    }

    return Array.from(
        navigation.querySelectorAll(
            'a[href="login.html"], ' +
            'a[href="signup.html"]'
        )
    );
}


function showGuestNavigation() {
    getGuestNavigationElements()
        .forEach((element) => {
            element.classList.remove(
                "account-hidden"
            );
        });
}


function hideGuestNavigation() {
    getGuestNavigationElements()
        .forEach((element) => {
            element.classList.add(
                "account-hidden"
            );
        });
}


function removeGeneratedAccountNavigation() {
    document
        .querySelectorAll(
            ".generated-account-link, " +
            ".generated-account-menu"
        )
        .forEach((element) => {
            element.remove();
        });
}


function getDisplayName(
    user,
    roleName
) {
    const source =
        roleName ||
        user.displayName ||
        user.email?.split("@")[0] ||
        "Account";

    return source
        .trim()
        .split(/\s+/)[0];
}


function createAccountNavigation({
    user,
    isAdmin,
    roleName,
    auth,
    signOut,
    navigation
}) {
    const destination =
        isAdmin
            ? "admin.html"
            : "dashboard.html";

    const mainLabel =
        isAdmin
            ? "Admin Portal"
            : "Dashboard";

    const displayName =
        getDisplayName(
            user,
            roleName
        );


    const mainLink =
        document.createElement("a");

    mainLink.href =
        destination;

    mainLink.textContent =
        mainLabel;

    mainLink.className =
        "generated-account-link";

    navigation.appendChild(
        mainLink
    );


    const accountMenu =
        document.createElement("div");

    accountMenu.className =
        "generated-account-menu";


    const accountLink =
        document.createElement("a");

    accountLink.href =
        destination;

    accountLink.className =
        "generated-account-name";

    accountLink.textContent =
        isAdmin
            ? `Admin: ${displayName}`
            : `Hi, ${displayName}`;


    const logoutButton =
        document.createElement("button");

    logoutButton.type =
        "button";

    logoutButton.className =
        "generated-logout-button";

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

                window.location.replace(
                    "index.html"
                );

            } catch (error) {
                console.error(
                    "Logout failed:",
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


function addAccountNavigationStyles() {
    if (
        document.getElementById(
            "accountNavigationStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "accountNavigationStyles";

    style.textContent = `
        .account-hidden {
            display: none !important;
        }

        .generated-account-link {
            display: inline-flex;
            min-height: 44px;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            padding: 10px 14px;
            background: #ee6c2f;
            color: white !important;
            font-weight: 850;
            text-decoration: none;
        }

        .generated-account-link:hover {
            background: #17233b;
            color: white !important;
        }

        .generated-account-menu {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .generated-account-name {
            display: inline-flex;
            min-height: 44px;
            align-items: center;
            border-radius: 10px;
            padding: 9px 13px;
            background: #fff1e9;
            color: #17233b !important;
            font-weight: 850;
            text-decoration: none;
        }

        .generated-logout-button {
            min-height: 44px;
            border: 1px solid #17233b;
            border-radius: 10px;
            padding: 10px 15px;
            background: white;
            color: #17233b;
            font-family: inherit;
            font-weight: 850;
            cursor: pointer;
        }

        .generated-logout-button:hover {
            background: #17233b;
            color: white;
        }

        @media (max-width: 980px) {
            .generated-account-link,
            .generated-account-menu,
            .generated-account-name,
            .generated-logout-button {
                width: 100%;
            }

            .generated-account-menu {
                align-items: stretch;
                flex-direction: column;
            }
        }
    `;

    document.head.appendChild(
        style
    );
}
