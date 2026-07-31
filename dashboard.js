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

const auth =
    getAuth(app);

const database =
    getFirestore(app);


const dashboardLoading =
    document.getElementById("dashboardLoading");

const dashboardContent =
    document.getElementById("dashboardContent");

const dashboardFullName =
    document.getElementById("dashboardFullName");

const dashboardEmail =
    document.getElementById("dashboardEmail");

const dashboardAvatar =
    document.getElementById("dashboardAvatar");

const dashboardDate =
    document.getElementById("dashboardDate");

const dashboardGreeting =
    document.getElementById("dashboardGreeting");

const memberSince =
    document.getElementById("memberSince");

const dashboardLogoutButton =
    document.getElementById(
        "dashboardLogoutButton"
    );


async function isAdministrator(user) {
    const roleReference =
        doc(
            database,
            "roles",
            user.uid
        );

    const roleSnapshot =
        await getDoc(roleReference);

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


function getDisplayName(user) {
    if (user.displayName?.trim()) {
        return user.displayName.trim();
    }

    if (user.email) {
        return user.email.split("@")[0];
    }

    return "Customer";
}


function getFirstName(fullName) {
    return fullName
        .trim()
        .split(/\s+/)[0];
}


function getInitial(
    fullName,
    email
) {
    const source =
        fullName || email || "C";

    return source
        .trim()
        .charAt(0)
        .toUpperCase();
}


function getGreeting() {
    const hour =
        new Date().getHours();

    if (hour < 12) {
        return "Good morning";
    }

    if (hour < 18) {
        return "Good afternoon";
    }

    return "Good evening";
}


function formatCurrentDate() {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    ).format(new Date());
}


function formatMemberSince(user) {
    const creationTime =
        user.metadata?.creationTime;

    if (!creationTime) {
        return "Active";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            year: "numeric"
        }
    ).format(
        new Date(creationTime)
    );
}


function displayDashboard(user) {
    const fullName =
        getDisplayName(user);

    const firstName =
        getFirstName(fullName);

    const email =
        user.email ||
        "Account email unavailable";


    if (dashboardFullName) {
        dashboardFullName.textContent =
            fullName;
    }

    if (dashboardEmail) {
        dashboardEmail.textContent =
            email;
    }

    if (dashboardAvatar) {
        dashboardAvatar.textContent =
            getInitial(
                fullName,
                email
            );
    }

    if (dashboardDate) {
        dashboardDate.textContent =
            formatCurrentDate();
    }

    if (dashboardGreeting) {
        dashboardGreeting.textContent =
            getGreeting();
    }

    if (memberSince) {
        memberSince.textContent =
            formatMemberSince(user);
    }


    document
        .querySelectorAll(
            "[data-dashboard-name], " +
            "[data-user-name]"
        )
        .forEach((element) => {
            element.textContent =
                firstName;
        });


    if (dashboardLoading) {
        dashboardLoading.hidden = true;
    }

    if (dashboardContent) {
        dashboardContent.hidden = false;
    }
}


onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.replace(
                "login.html"
            );

            return;
        }

        try {
            const administrator =
                await isAdministrator(user);

            if (administrator) {
                window.location.replace(
                    "admin.html"
                );

                return;
            }

            displayDashboard(user);

        } catch (error) {
            console.error(
                "Dashboard role check failed:",
                error
            );

            displayDashboard(user);
        }
    }
);


if (dashboardLogoutButton) {
    dashboardLogoutButton.addEventListener(
        "click",
        async () => {
            dashboardLogoutButton.disabled = true;

            dashboardLogoutButton.textContent =
                "Logging Out...";

            try {
                await signOut(auth);

                window.location.href =
                    "index.html";

            } catch (error) {
                console.error(
                    "Account logout error:",
                    error
                );

                dashboardLogoutButton.disabled =
                    false;

                dashboardLogoutButton.textContent =
                    "Log Out";
            }
        }
    );
}
