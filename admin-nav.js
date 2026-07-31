import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


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

const auth =
    getAuth(app);

const database =
    getFirestore(app);


let administratorApproved = false;


function addAdminStyles() {
    if (
        document.getElementById(
            "packagedComfortAdminNavStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "packagedComfortAdminNavStyles";

    style.textContent = `
        .site-admin-portal-link {
            display: inline-flex;
            min-height: 44px;
            align-items: center;
            justify-content: center;
            border: 1px solid #ee6c2f;
            border-radius: 10px;
            padding: 10px 15px;
            background: #ee6c2f;
            color: white !important;
            font-weight: 850;
            text-decoration: none;
        }

        .site-admin-portal-link:hover,
        .site-admin-portal-link:focus {
            border-color: #17233b;
            background: #17233b;
            color: white !important;
        }

        @media (max-width: 980px) {
            .site-admin-portal-link {
                width: 100%;
            }
        }
    `;

    document.head.appendChild(style);
}


async function isAdministrator(user) {
    if (!user) {
        return false;
    }

    const roleSnapshot =
        await getDoc(
            doc(
                database,
                "roles",
                user.uid
            )
        );

    if (!roleSnapshot.exists()) {
        return false;
    }

    const role =
        roleSnapshot.data();

    return (
        String(role.role || "")
            .trim()
            .toLowerCase() === "admin" &&
        role.active === true
    );
}


function removeAdminLinks() {
    document
        .querySelectorAll(
            ".site-admin-portal-link"
        )
        .forEach((link) => {
            link.remove();
        });
}


function placeAdminLink() {
    if (!administratorApproved) {
        removeAdminLinks();
        return;
    }

    const navigation =
        document.getElementById("mainNav") ||
        document.querySelector(".main-nav");

    if (!navigation) {
        return;
    }

    if (
        navigation.querySelector(
            ".site-admin-portal-link"
        )
    ) {
        return;
    }

    const adminLink =
        document.createElement("a");

    adminLink.href =
        "admin.html";

    adminLink.textContent =
        "Admin Portal";

    adminLink.className =
        "site-admin-portal-link";


    const accountMenu =
        navigation.querySelector(
            ".account-menu, " +
            ".firebase-account-menu, " +
            "[data-auth-user]"
        );


    if (accountMenu) {
        navigation.insertBefore(
            adminLink,
            accountMenu
        );
    } else {
        navigation.appendChild(
            adminLink
        );
    }
}


const navigationObserver =
    new MutationObserver(() => {
        placeAdminLink();
    });


const navigationRoot =
    document.getElementById("mainNav") ||
    document.querySelector(".main-nav") ||
    document.body;


navigationObserver.observe(
    navigationRoot,
    {
        childList: true,
        subtree: true
    }
);


addAdminStyles();


onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            administratorApproved = false;
            removeAdminLinks();
            return;
        }

        try {
            administratorApproved =
                await isAdministrator(user);

            placeAdminLink();

        } catch (error) {
            console.error(
                "Admin navigation check failed:",
                error
            );

            administratorApproved = false;
            removeAdminLinks();
        }
    }
);
