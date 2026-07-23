import { auth } from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const authMessage = document.getElementById("authMessage");


function showMessage(message, isError = false) {
    if (!authMessage) {
        return;
    }

    authMessage.textContent = message;
    authMessage.style.color = isError ? "#b42318" : "#1c7c54";
}


function friendlyError(error) {
    switch (error.code) {
        case "auth/email-already-in-use":
            return "An account already exists with this email.";

        case "auth/invalid-email":
            return "Enter a valid email address.";

        case "auth/weak-password":
            return "Your password must contain at least 6 characters.";

        case "auth/invalid-credential":
            return "The email address or password is incorrect.";

        case "auth/too-many-requests":
            return "Too many attempts. Wait a moment and try again.";

        case "auth/network-request-failed":
            return "Check your internet connection and try again.";

        default:
            console.error(error);
            return "Something went wrong. Please try again.";
    }
}


/* Create customer account */

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document
            .getElementById("signupName")
            .value
            .trim();

        const email = document
            .getElementById("signupEmail")
            .value
            .trim();

        const password = document
            .getElementById("signupPassword")
            .value;

        const signupButton = document.getElementById("signupButton");

        signupButton.disabled = true;
        signupButton.textContent = "Creating Account...";
        showMessage("");

        try {
            const result = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            await updateProfile(result.user, {
                displayName: fullName
            });

            showMessage("Account created successfully.");

            window.setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 800);

        } catch (error) {
            showMessage(friendlyError(error), true);

            signupButton.disabled = false;
            signupButton.textContent = "Create Account";
        }
    });
}


/* Log customer in */

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document
            .getElementById("loginEmail")
            .value
            .trim();

        const password = document
            .getElementById("loginPassword")
            .value;

        const loginButton = document.getElementById("loginButton");

        loginButton.disabled = true;
        loginButton.textContent = "Logging In...";
        showMessage("");

        try {
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            showMessage("Login successful.");

            window.setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 700);

        } catch (error) {
            showMessage(friendlyError(error), true);

            loginButton.disabled = false;
            loginButton.textContent = "Log In";
        }
    });
}
