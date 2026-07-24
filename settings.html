import {
    initializeApp,
    getApp,
    getApps
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    EmailAuthProvider,
    getAuth,
    onAuthStateChanged,
    reauthenticateWithCredential,
    sendPasswordResetEmail,
    updatePassword,
    updateProfile
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


const settingsLoading =
    document.getElementById("settingsLoading");

const settingsContent =
    document.getElementById("settingsContent");

const profileForm =
    document.getElementById("profileForm");

const passwordForm =
    document.getElementById("passwordForm");

const settingsName =
    document.getElementById("settingsName");

const settingsEmail =
    document.getElementById("settingsEmail");

const accountDisplayName =
    document.getElementById("accountDisplayName");

const accountEmailSummary =
    document.getElementById("accountEmailSummary");

const accountAvatar =
    document.getElementById("accountAvatar");

const saveProfileButton =
    document.getElementById("saveProfileButton");

const changePasswordButton =
    document.getElementById("changePasswordButton");

const resetPasswordButton =
    document.getElementById("resetPasswordButton");

const profileMessage =
    document.getElementById("profileMessage");

const passwordMessage =
    document.getElementById("passwordMessage");

const resetMessage =
    document.getElementById("resetMessage");


let activeUser = null;


function setMessage(element, message, isError = false) {
    element.textContent = message;

    element.style.color =
        isError ? "#b42318" : "#1c7c54";
}


function setButtonLoading(
    button,
    loading,
    normalText,
    loadingText
) {
    button.disabled = loading;

    button.textContent =
        loading ? loadingText : normalText;
}


function getInitial(name, email) {
    const source =
        (name || email || "C").trim();

    return source.charAt(0).toUpperCase();
}


function displayAccount(user) {
    const displayName =
        user.displayName?.trim() || "Customer";

    const email =
        user.email || "No email available";

    settingsName.value = displayName;
    settingsEmail.textContent = email;

    accountDisplayName.textContent = displayName;
    accountEmailSummary.textContent = email;
    accountAvatar.textContent =
        getInitial(displayName, email);

    settingsLoading.hidden = true;
    settingsContent.hidden = false;
}


function friendlyError(error) {
    switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
            return "Your current password is incorrect.";

        case "auth/weak-password":
            return "The new password must contain at least 6 characters.";

        case "auth/requires-recent-login":
            return "Please log out, log back in, and try again.";

        case "auth/too-many-requests":
            return "Too many attempts. Wait a moment and try again.";

        case "auth/network-request-failed":
            return "Check your internet connection and try again.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        default:
            console.error("Account settings error:", error);

            return `Something went wrong: ${
                error.code || error.message
            }`;
    }
}


onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    activeUser = user;
    displayAccount(user);
});


profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!activeUser) {
        return;
    }

    const fullName =
        settingsName.value.trim();

    if (!fullName) {
        setMessage(
            profileMessage,
            "Enter your full name.",
            true
        );

        return;
    }

    setButtonLoading(
        saveProfileButton,
        true,
        "Save Profile",
        "Saving..."
    );

    setMessage(profileMessage, "");

    try {
        await updateProfile(activeUser, {
            displayName: fullName
        });

        accountDisplayName.textContent = fullName;
        accountAvatar.textContent =
            getInitial(fullName, activeUser.email);

        document
            .querySelectorAll(
                "[data-user-name], [data-dashboard-name]"
            )
            .forEach((element) => {
                element.textContent =
                    fullName.split(/\s+/)[0];
            });

        setMessage(
            profileMessage,
            "Your profile name was updated."
        );
    } catch (error) {
        setMessage(
            profileMessage,
            friendlyError(error),
            true
        );
    } finally {
        setButtonLoading(
            saveProfileButton,
            false,
            "Save Profile",
            "Saving..."
        );
    }
});


passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!activeUser || !activeUser.email) {
        return;
    }

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (newPassword.length < 6) {
        setMessage(
            passwordMessage,
            "The new password must contain at least 6 characters.",
            true
        );

        return;
    }

    if (newPassword !== confirmPassword) {
        setMessage(
            passwordMessage,
            "The new passwords do not match.",
            true
        );

        return;
    }

    if (currentPassword === newPassword) {
        setMessage(
            passwordMessage,
            "Choose a password different from your current password.",
            true
        );

        return;
    }

    setButtonLoading(
        changePasswordButton,
        true,
        "Change Password",
        "Changing Password..."
    );

    setMessage(passwordMessage, "");

    try {
        const credential =
            EmailAuthProvider.credential(
                activeUser.email,
                currentPassword
            );

        await reauthenticateWithCredential(
            activeUser,
            credential
        );

        await updatePassword(
            activeUser,
            newPassword
        );

        passwordForm.reset();

        setMessage(
            passwordMessage,
            "Your password was changed successfully."
        );
    } catch (error) {
        setMessage(
            passwordMessage,
            friendlyError(error),
            true
        );
    } finally {
        setButtonLoading(
            changePasswordButton,
            false,
            "Change Password",
            "Changing Password..."
        );
    }
});


resetPasswordButton.addEventListener("click", async () => {
    if (!activeUser?.email) {
        return;
    }

    setButtonLoading(
        resetPasswordButton,
        true,
        "Send Reset Email",
        "Sending..."
    );

    setMessage(resetMessage, "");

    try {
        await sendPasswordResetEmail(
            auth,
            activeUser.email
        );

        setMessage(
            resetMessage,
            `A password-reset email was sent to ${activeUser.email}.`
        );
    } catch (error) {
        setMessage(
            resetMessage,
            friendlyError(error),
            true
        );
    } finally {
        setButtonLoading(
            resetPasswordButton,
            false,
            "Send Reset Email",
            "Sending..."
        );
    }
});
