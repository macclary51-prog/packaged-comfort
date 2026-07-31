import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const dashboardLoading =
    document.getElementById("dashboardLoading");

const dashboardContent =
    document.getElementById("dashboardContent");

const dashboardDate =
    document.getElementById("dashboardDate");

const dashboardGreeting =
    document.getElementById("dashboardGreeting");

const dashboardFirstName =
    document.getElementById("dashboardFirstName");

const dashboardFullName =
    document.getElementById("dashboardFullName");

const dashboardEmail =
    document.getElementById("dashboardEmail");


async function isAdministrator(user) {
    const roleSnapshot =
        await getDoc(
            doc(
                db,
                "roles",
                user.uid
            )
        );

    if (!roleSnapshot.exists()) {
        return false;
    }

    const roleData =
        roleSnapshot.data();

    return (
        String(roleData.role || "")
            .trim()
            .toLowerCase() === "admin"
        &&
        roleData.active === true
    );
}


function getFullName(user) {
    return (
        user.displayName?.trim() ||
        user.email?.split("@")[0] ||
        "Customer"
    );
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


function formatDate() {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric"
        }
    ).format(
        new Date()
    );
}


function showCustomerDashboard(user) {
    const fullName =
        getFullName(user);

    const firstName =
        fullName
            .split(/\s+/)[0];

    dashboardDate.textContent =
        formatDate();

    dashboardGreeting.textContent =
        getGreeting();

    dashboardFirstName.textContent =
        firstName;

    dashboardFullName.textContent =
        fullName;

    dashboardEmail.textContent =
        user.email ||
        "Account email unavailable";

    dashboardLoading.hidden =
        true;

    dashboardContent.hidden =
        false;
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

            showCustomerDashboard(user);

        } catch (error) {
            console.error(
                "Customer dashboard role check failed:",
                error
            );

            dashboardLoading.textContent =
                "The account permission could not be verified. Check the Firebase configuration and administrator UID.";
        }
    }
);
