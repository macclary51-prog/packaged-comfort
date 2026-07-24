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


const accountLoading =
    document.getElementById("accountLoading");

const accountContent =
    document.getElementById("accountContent");

const dashboardFullName =
    document.getElementById("dashboardFullName");

const dashboardEmail =
    document.getElementById("dashboardEmail");

const dashboardAvatar =
    document.getElementById("dashboardAvatar");


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


function getInitial(fullName, email) {
    const source =
        fullName || email || "C";

    return source
        .trim()
        .charAt(0)
        .toUpperCase();
}


onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    const fullName =
        getDisplayName(user);

    const firstName =
        getFirstName(fullName);

    const email =
        user.email || "Account email unavailable";


    document
        .querySelectorAll(
            "[data-dashboard-name], [data-user-name]"
        )
        .forEach((element) => {
            element.textContent = firstName;
        });


    dashboardFullName.textContent =
        fullName;

    dashboardEmail.textContent =
        email;

    dashboardAvatar.textContent =
        getInitial(fullName, email);


    accountLoading.hidden = true;
    accountContent.hidden = false;
});
