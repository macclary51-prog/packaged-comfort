"use strict";

/* ========================================
   Packaged Confort
   Main Website JavaScript
======================================== */


/* Elements */

const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");

const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const quoteForm = document.getElementById("quoteForm");

const photoInput = document.getElementById("movingPhotos");
const photoPreview = document.getElementById("photoPreview");
const uploadArea = document.getElementById("uploadArea");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const currentYear = document.getElementById("currentYear");

let selectedPhotos = [];
let toastTimer;


/* Current year */

currentYear.textContent = new Date().getFullYear();


/* Mobile navigation */

menuButton.addEventListener("click", () => {
    const menuIsOpen = mainNav.classList.toggle("open");

    menuButton.classList.toggle("active", menuIsOpen);
    menuButton.setAttribute("aria-expanded", String(menuIsOpen));
});


document.querySelectorAll("#mainNav a").forEach((link) => {
    link.addEventListener("click", () => {
        closeMobileMenu();
    });
});


function closeMobileMenu() {
    mainNav.classList.remove("open");
    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
}


/* Modal controls */

const loginButtons = [
    document.getElementById("openLoginButton"),
    document.getElementById("accountLoginButton"),
    document.getElementById("footerLoginButton")
];

const signupButtons = [
    document.getElementById("openSignupButton"),
    document.getElementById("accountSignupButton"),
    document.getElementById("footerSignupButton")
];


loginButtons.forEach((button) => {
    button.addEventListener("click", () => {
        openModal(loginModal);
        closeMobileMenu();
    });
});


signupButtons.forEach((button) => {
    button.addEventListener("click", () => {
        openModal(signupModal);
        closeMobileMenu();
    });
});


document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
        closeAllModals();
    });
});


document.getElementById("switchToSignup").addEventListener("click", () => {
    closeModal(loginModal);
    openModal(signupModal);
});


document.getElementById("switchToLogin").addEventListener("click", () => {
    closeModal(signupModal);
    openModal(loginModal);
});


[loginModal, signupModal].forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});


document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeAllModals();
        closeMobileMenu();
    }
});


function openModal(modal) {
    closeAllModals();

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    document.body.classList.add("modal-open");

    const firstInput = modal.querySelector("input");

    window.setTimeout(() => {
        firstInput?.focus();
    }, 150);
}


function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    if (
        !loginModal.classList.contains("open") &&
        !signupModal.classList.contains("open")
    ) {
        document.body.classList.remove("modal-open");
    }
}


function closeAllModals() {
    closeModal(loginModal);
    closeModal(signupModal);
}


/* Temporary login form */

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    showToast(
        "The login form is ready. Firebase Authentication will make it fully functional."
    );

    loginForm.reset();
    closeModal(loginModal);
});


/* Temporary signup form */

signupForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const password = document.getElementById("signupPassword").value;

    if (password.length < 6) {
        showToast("Your password must contain at least 6 characters.");
        return;
    }

    showToast(
        "The signup form is ready. Firebase Authentication will create customer accounts."
    );

    signupForm.reset();
    closeModal(signupModal);
});


/* Quote form */

quoteForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!quoteForm.checkValidity()) {
        quoteForm.reportValidity();
        return;
    }

    const fullName = document.getElementById("fullName").value.trim();

    showToast(
        `Thank you, ${fullName}. The quote form is ready for Firebase connection.`
    );

    quoteForm.reset();

    selectedPhotos = [];
    renderPhotoPreview();
});


/* Photo uploads */

photoInput.addEventListener("change", (event) => {
    addPhotos(event.target.files);
});


function addPhotos(fileList) {
    const incomingFiles = Array.from(fileList);

    const validFiles = incomingFiles.filter((file) => {
        return file.type.startsWith("image/");
    });

    if (validFiles.length !== incomingFiles.length) {
        showToast("Only image files can be uploaded.");
    }

    const availableSpaces = 12 - selectedPhotos.length;
    const filesToAdd = validFiles.slice(0, availableSpaces);

    if (availableSpaces <= 0) {
        showToast("You can upload up to 12 photos.");
        return;
    }

    if (validFiles.length > availableSpaces) {
        showToast("Only the first 12 photos were added.");
    }

    selectedPhotos = [...selectedPhotos, ...filesToAdd];

    updatePhotoInput();
    renderPhotoPreview();
}


function renderPhotoPreview() {
    photoPreview.innerHTML = "";

    selectedPhotos.forEach((file, index) => {
        const previewItem = document.createElement("div");
        previewItem.className = "preview-item";

        const image = document.createElement("img");
        image.alt = `Moving photo ${index + 1}`;

        const objectUrl = URL.createObjectURL(file);
        image.src = objectUrl;

        image.addEventListener(
            "load",
            () => {
                URL.revokeObjectURL(objectUrl);
            },
            { once: true }
        );

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.setAttribute(
            "aria-label",
            `Remove photo ${index + 1}`
        );
        removeButton.textContent = "×";

        removeButton.addEventListener("click", () => {
            removePhoto(index);
        });

        previewItem.append(image, removeButton);
        photoPreview.appendChild(previewItem);
    });
}


function removePhoto(index) {
    selectedPhotos.splice(index, 1);

    updatePhotoInput();
    renderPhotoPreview();
}


function updatePhotoInput() {
    const transfer = new DataTransfer();

    selectedPhotos.forEach((file) => {
        transfer.items.add(file);
    });

    photoInput.files = transfer.files;
}


/* Drag and drop support */

["dragenter", "dragover"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadArea.classList.add("dragging");
    });
});


["dragleave", "drop"].forEach((eventName) => {
    uploadArea.addEventListener(eventName, (event) => {
        event.preventDefault();
        uploadArea.classList.remove("dragging");
    });
});


uploadArea.addEventListener("drop", (event) => {
    addPhotos(event.dataTransfer.files);
});


/* Toast notification */

function showToast(message) {
    window.clearTimeout(toastTimer);

    toastMessage.textContent = message;
    toast.classList.add("show");

    toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 4500);
}


/* Close mobile menu when clicking outside */

document.addEventListener("click", (event) => {
    const clickedInsideNavigation =
        mainNav.contains(event.target) ||
        menuButton.contains(event.target);

    if (!clickedInsideNavigation) {
        closeMobileMenu();
    }
});


/* Set the earliest move date to today */

const moveDateInput = document.getElementById("moveDate");

const today = new Date();
const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
)
    .toISOString()
    .split("T")[0];

moveDateInput.min = localToday;
