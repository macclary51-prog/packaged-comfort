import {
    auth
} from "./firebase-config.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const database =
    getFirestore(auth.app);


const signupForm =
    document.getElementById("signupForm");

const loginForm =
    document.getElementById("loginForm");

const authMessage =
    document.getElementById("authMessage");


function showMessage(
    message,
    isError = false
) {
    if (!authMessage) {
        return;
    }

    authMessage.textContent = message;

    authMessage.style.color =
        isError ? "#b42318" : "#176b46";
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
        case "auth/invalid-login-credentials":
        case "auth/user-not-found":
        case "auth/wrong-password":
            return "The email address or password is incorrect.";

        case "auth/user-disabled":
            return "This account has been disabled.";

        case "auth/too-many-requests":
            return "Too many attempts were made. Wait and try again.";

        case "auth/network-request-failed":
            return "Check your internet connection and try again.";

        case "permission-denied":
            return "The website could not verify this account's permission.";

        default:
            console.error(
                "Account error:",
                error
            );

            return "Something went wrong. Please try again.";
    }
}


async function getAccountRole(user) {
    const roleReference =
        doc(
            database,
            "roles",
            user.uid
        );

    const roleSnapshot =
        await getDoc(roleReference);

    if (!roleSnapshot.exists()) {
        return {
            isAdmin: false
        };
    }

    const roleData =
        roleSnapshot.data();

    return {
        isAdmin:
            String(roleData.role || "")
                .trim()
                .toLowerCase() === "admin"
            &&
            roleData.active === true
    };
}


/* ========================================
   CREATE NORMAL CUSTOMER ACCOUNT
======================================== */

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
                document.getElementById(
                    "signupButton"
                );

            signupButton.disabled = true;

            signupButton.textContent =
                "Creating Account...";

            showMessage("");

            try {
                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                await updateProfile(
                    result.user,
                    {
                        displayName: fullName
                    }
                );

                showMessage(
                    "Account created successfully."
                );

                window.setTimeout(() => {
                    window.location.replace(
                        "dashboard.html"
                    );
                }, 600);

            } catch (error) {
                showMessage(
                    friendlyError(error),
                    true
                );

                signupButton.disabled = false;

                signupButton.textContent =
                    "Create Account";
            }
        }
    );
}


/* ========================================
   LOG IN CUSTOMER OR ADMINISTRATOR
======================================== */

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
                document.getElementById(
                    "loginButton"
                );

            loginButton.disabled = true;

            loginButton.textContent =
                "Checking Account...";

            showMessage("");

            try {
                const result =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const accountRole =
                    await getAccountRole(
                        result.user
                    );

                if (accountRole.isAdmin) {
                    showMessage(
                        "Administrator access confirmed."
                    );

                    window.setTimeout(() => {
                        window.location.replace(
                            "admin.html"
                        );
                    }, 350);

                    return;
                }

                showMessage(
                    "Customer login successful."
                );

                window.setTimeout(() => {
                    window.location.replace(
                        "dashboard.html"
                    );
                }, 350);

            } catch (error) {
                showMessage(
                    friendlyError(error),
                    true
                );

                loginButton.disabled = false;

                loginButton.textContent =
                    "Log In";
            }
        }
    );
}
