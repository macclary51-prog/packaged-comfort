import {
    auth,
    db
} from "./firebase-config.js?v=31";

import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const signupForm =
    document.getElementById("signupForm");

const loginForm =
    document.getElementById("loginForm");

const authMessage =
    document.getElementById("authMessage");

let formIsSubmitting = false;
let routeIsRunning = false;

const FRANKLIN_ADMIN_UID =
    "lE77uZp22tbjptd1k9Nt89eOdW12";

const FRANKLIN_ADMIN_EMAIL =
    "pcmovers01@gmail.com";


function isFranklinAdministrator(user) {
    return Boolean(
        user
        &&
        (
            user.uid === FRANKLIN_ADMIN_UID
            ||
            String(user.email || "")
                .trim()
                .toLowerCase() === FRANKLIN_ADMIN_EMAIL
        )
    );
}


function showMessage(
    message,
    isError = false
) {
    if (!authMessage) {
        return;
    }

    authMessage.textContent =
        message;

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
                "Authentication error:",
                error
            );

            return "Something went wrong. Please try again.";
    }
}


async function getRoleRecord(user) {
    if (isFranklinAdministrator(user)) {
        return {
            exists: true,
            isAdmin: true,
            data: {
                role: "admin",
                active: true,
                name: "Franklin",
                email: FRANKLIN_ADMIN_EMAIL
            }
        };
    }

    const roleReference =
        doc(
            db,
            "roles",
            user.uid
        );

    const roleSnapshot =
        await getDoc(roleReference);

    if (!roleSnapshot.exists()) {
        return {
            exists: false,
            isAdmin: false,
            data: null
        };
    }

    const roleData =
        roleSnapshot.data();

    const roleName =
        String(roleData.role || "")
            .trim()
            .toLowerCase();

    return {
        exists: true,

        isAdmin:
            roleName === "admin" &&
            roleData.active === true,

        data:
            roleData
    };
}


async function saveCustomerProfile(user) {
    const customerReference =
        doc(
            db,
            "customers",
            user.uid
        );

    const customerSnapshot =
        await getDoc(customerReference);

    const customerData = {
        name:
            user.displayName?.trim() ||
            user.email?.split("@")[0] ||
            "Customer",

        email:
            user.email || "",

        lastLoginAt:
            serverTimestamp()
    };

    if (!customerSnapshot.exists()) {
        customerData.createdAt =
            serverTimestamp();
    }

    await setDoc(
        customerReference,
        customerData,
        {
            merge: true
        }
    );
}


async function routeSignedInUser(user) {
    if (
        !user ||
        routeIsRunning
    ) {
        return;
    }

    routeIsRunning = true;

    try {
        const roleRecord =
            await getRoleRecord(user);

        if (roleRecord.isAdmin) {
            window.location.replace(
                "admin.html"
            );

            return;
        }

        await saveCustomerProfile(user);

        window.location.replace(
            "dashboard.html"
        );

    } catch (error) {
        routeIsRunning = false;

        console.error(
            "Account routing failed:",
            error
        );

        showMessage(
            "The website could not verify this account. Check the Firebase project and administrator UID.",
            true
        );
    }
}


/* ========================================
   CUSTOMER SIGNUP
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

            formIsSubmitting = true;

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

                await saveCustomerProfile(
                    result.user
                );

                showMessage(
                    "Account created successfully."
                );

                window.setTimeout(() => {
                    window.location.replace(
                        "dashboard.html"
                    );
                }, 500);

            } catch (error) {
                formIsSubmitting = false;

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
   CUSTOMER OR ADMIN LOGIN
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

            formIsSubmitting = true;

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

                const roleRecord =
                    await getRoleRecord(
                        result.user
                    );

                if (roleRecord.isAdmin) {
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

                await saveCustomerProfile(
                    result.user
                );

                showMessage(
                    "Customer login successful."
                );

                window.setTimeout(() => {
                    window.location.replace(
                        "dashboard.html"
                    );
                }, 350);

            } catch (error) {
                formIsSubmitting = false;

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


    onAuthStateChanged(
        auth,
        async (user) => {
            if (
                !user ||
                formIsSubmitting
            ) {
                return;
            }

            await routeSignedInUser(user);
        }
    );
}


/*
  This export is not required by the pages, but it makes
  browser-console testing easier.
*/
export {
    getRoleRecord,
    routeSignedInUser,
    signOut
};
