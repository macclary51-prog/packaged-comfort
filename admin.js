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

const auth = getAuth(app);
const database = getFirestore(app);


const adminLoading =
    document.getElementById("adminLoading");

const adminProtected =
    document.getElementById("adminProtected");

const adminTopName =
    document.getElementById("adminTopName");

const adminTopEmail =
    document.getElementById("adminTopEmail");

const adminFirstName =
    document.getElementById("adminFirstName");

const adminLogoutButton =
    document.getElementById("adminLogoutButton");


async function userHasAdminAccess(user) {
    const roleReference =
        doc(database, "roles", user.uid);

    const roleSnapshot =
        await getDoc(roleReference);

    if (!roleSnapshot.exists()) {
        return false;
    }

    const roleData =
        roleSnapshot.data();

    return (
        roleData.role === "admin" &&
        roleData.active === true
    );
}


function getDisplayName(user) {
    if (user.displayName?.trim()) {
        return user.displayName.trim();
    }

    if (user.email) {
        return user.email.split("@")[0];
    }

    return "Administrator";
}


function showAdminPortal(user) {
    const displayName =
        getDisplayName(user);

    adminTopName.textContent =
        displayName;

    adminTopEmail.textContent =
        user.email || "Administrator account";

    adminFirstName.textContent =
        displayName.split(/\s+/)[0];

    adminLoading.hidden = true;
    adminProtected.hidden = false;

    requestAnimationFrame(() => {
        adminProtected.classList.add(
            "access-approved"
        );
    });
}


onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.replace(
                "admin-login.html"
            );

            return;
        }

        try {
            const hasAccess =
                await userHasAdminAccess(user);

            if (!hasAccess) {
                window.location.replace(
                    "dashboard.html"
                );

                return;
            }

            showAdminPortal(user);

        } catch (error) {
            console.error(
                "Administrator access check failed:",
                error
            );

            window.location.replace(
                "admin-login.html"
            );
        }
    }
);


adminLogoutButton.addEventListener(
    "click",
    async () => {
        adminLogoutButton.disabled = true;
        adminLogoutButton.textContent =
            "Logging Out...";

        try {
            await signOut(auth);

            window.location.replace(
                "admin-login.html"
            );

        } catch (error) {
            console.error(
                "Administrator logout error:",
                error
            );

            adminLogoutButton.disabled = false;
            adminLogoutButton.textContent =
                "Log Out";
        }
    }
);
