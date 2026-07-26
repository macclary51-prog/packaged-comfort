import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    browserLocalPersistence,
    getAuth,
    setPersistence,
    signInWithEmailAndPassword,
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


const adminLoginForm =
    document.getElementById("adminLoginForm");

const adminEmail =
    document.getElementById("adminEmail");

const adminPassword =
    document.getElementById("adminPassword");

const adminLoginButton =
    document.getElementById("adminLoginButton");

const adminLoginMessage =
    document.getElementById("adminLoginMessage");


function showMessage(message, isError = false) {
    adminLoginMessage.textContent = message;

    adminLoginMessage.style.color =
        isError ? "#b42318" : "#176b46";
}


function setLoading(loading) {
    adminLoginButton.disabled = loading;

    adminLoginButton.textContent = loading
        ? "Verifying Access..."
        : "Enter Admin Portal";
}


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


function loginErrorMessage(error) {
    switch (error.code) {
        case "auth/invalid-email":
            return "Enter a valid administrator email.";

        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "The email or password is incorrect.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/too-many-requests":
            return "Too many attempts were made. Wait and try again.";

        case "auth/network-request-failed":
            return "Check your internet connection and try again.";

        case "permission-denied":
            return "This account is not authorized for administrator access.";

        default:
            console.error(
                "Administrator login error:",
                error
            );

            return "Administrator access could not be verified.";
    }
}


adminLoginForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        if (!adminLoginForm.checkValidity()) {
            adminLoginForm.reportValidity();
            return;
        }

        setLoading(true);
        showMessage("");

        try {
            await setPersistence(
                auth,
                browserLocalPersistence
            );

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    adminEmail.value.trim(),
                    adminPassword.value
                );

            const hasAccess =
                await userHasAdminAccess(
                    credential.user
                );

            if (!hasAccess) {
                await signOut(auth);

                showMessage(
                    "This account does not have administrator permission.",
                    true
                );

                setLoading(false);
                return;
            }

            showMessage(
                "Access confirmed. Opening the Admin Portal..."
            );

            window.setTimeout(() => {
                window.location.replace("admin.html");
            }, 500);

        } catch (error) {
            try {
                await signOut(auth);
            } catch {
                // No action is needed if no session exists.
            }

            showMessage(
                loginErrorMessage(error),
                true
            );

            setLoading(false);
        }
    }
);
