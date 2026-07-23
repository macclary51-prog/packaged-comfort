import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const signupForm =
    document.getElementById("signupForm");

const loginForm =
    document.getElementById("loginForm");

const authMessage =
    document.getElementById("authMessage");


function displayMessage(message, isError = false) {
    if (!authMessage) {
        return;
    }

    authMessage.textContent = message;

    authMessage.style.color =
        isError ? "#b42318" : "#1c7c54";
}


function setButtonState(
    button,
    loading,
    normalText,
    loadingText
) {
    if (!button) {
        return;
    }

    button.disabled = loading;

    button.textContent =
        loading ? loadingText : normalText;

    button.style.opacity =
        loading ? "0.72" : "1";

    button.style.cursor =
        loading ? "wait" : "pointer";
}


function friendlyFirebaseError(error) {
    switch (error.code) {
        case "auth/email-already-in-use":
            return "An account already exists with this email address.";

        case "auth/invalid-email":
            return "Enter a valid email address.";

        case "auth/weak-password":
            return "Use a password containing at least 6 characters.";

        case "auth/invalid-credential":
            return "The email address or password is incorrect.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/too-many-requests":
            return "Too many attempts were made. Wait and try again.";

        case "auth/network-request-failed":
            return "Check your internet connection and try again.";

        case "auth/operation-not-allowed":
            return "Email and password login is not enabled in Firebase.";

        default:
            console.error(
                "Firebase Authentication error:",
                error
            );

            return "Something went wrong. Please try again.";
    }
}


/* Create an account */

if (signupForm) {
    signupForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            if (!signupForm.checkValidity()) {
                signupForm.reportValidity();
                return;
            }

            const fullName =
                document
                    .getElementById("signupName")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("signupEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("signupPassword")
                    .value;

            const signupButton =
                document.getElementById("signupButton");

            displayMessage("");

            setButtonState(
                signupButton,
                true,
                "Create Account",
                "Creating Account..."
            );

            try {
                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                await updateProfile(
                    userCredential.user,
                    {
                        displayName: fullName
                    }
                );

                displayMessage(
                    "Account created successfully. Opening your dashboard..."
                );

                window.setTimeout(() => {
                    window.location.href =
                        "dashboard.html";
                }, 900);
            } catch (error) {
                displayMessage(
                    friendlyFirebaseError(error),
                    true
                );

                setButtonState(
                    signupButton,
                    false,
                    "Create Account",
                    "Creating Account..."
                );
            }
        }
    );
}


/* Log into an existing account */

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            if (!loginForm.checkValidity()) {
                loginForm.reportValidity();
                return;
            }

            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("loginPassword")
                    .value;

            const loginButton =
                document.getElementById("loginButton");

            displayMessage("");

            setButtonState(
                loginButton,
                true,
                "Log In",
                "Logging In..."
            );

            try {
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                displayMessage(
                    "Login successful. Opening your dashboard..."
                );

                window.setTimeout(() => {
                    window.location.href =
                        "dashboard.html";
                }, 700);
            } catch (error) {
                displayMessage(
                    friendlyFirebaseError(error),
                    true
                );

                setButtonState(
                    loginButton,
                    false,
                    "Log In",
                    "Logging In..."
                );
            }
        }
    );
}
