"use strict";


/* ========================================
   Packaged Comfort
   Shared Website JavaScript
======================================== */


const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

let toastTimer;


/* Mobile navigation */

if (menuButton && mainNav) {
    menuButton.addEventListener("click", () => {
        const menuIsOpen = mainNav.classList.toggle("open");

        menuButton.setAttribute(
            "aria-expanded",
            String(menuIsOpen)
        );

        menuButton.textContent = menuIsOpen ? "×" : "☰";
    });


    mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            closeMobileMenu();
        });
    });


    document.addEventListener("click", (event) => {
        const clickedInsideMenu =
            mainNav.contains(event.target) ||
            menuButton.contains(event.target);

        if (!clickedInsideMenu) {
            closeMobileMenu();
        }
    });
}


function closeMobileMenu() {
    if (!menuButton || !mainNav) {
        return;
    }

    mainNav.classList.remove("open");

    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    menuButton.textContent = "☰";
}


/* Current year */

document
    .querySelectorAll("[data-current-year]")
    .forEach((element) => {
        element.textContent = new Date().getFullYear();
    });


/* Toast message */

function showToast(message) {
    if (!toast || !toastMessage) {
        return;
    }

    window.clearTimeout(toastTimer);

    toastMessage.textContent = message;
    toast.classList.add("show");

    toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 4200);
}


/* Temporary forms that are not connected yet */

document
    .querySelectorAll("[data-demo-form]")
    .forEach((form) => {
        form.addEventListener("submit", (event) => {
            event.preventDefault();

            showToast(
                "This form will work after its Firebase feature is connected."
            );
        });
    });


/* Quote photo previews */

const photoInput = document.getElementById("movingPhotos");
const photoPreview = document.getElementById("photoPreview");

let selectedPhotos = [];


if (photoInput && photoPreview) {
    photoInput.addEventListener("change", (event) => {
        const incomingFiles = Array.from(
            event.target.files
        );

        const imageFiles = incomingFiles.filter((file) => {
            return file.type.startsWith("image/");
        });

        const spacesRemaining = 12 - selectedPhotos.length;

        selectedPhotos = [
            ...selectedPhotos,
            ...imageFiles.slice(0, spacesRemaining)
        ];

        renderPhotoPreview();

        photoInput.value = "";
    });
}


function renderPhotoPreview() {
    if (!photoPreview) {
        return;
    }

    photoPreview.innerHTML = "";

    selectedPhotos.forEach((file, index) => {
        const previewItem = document.createElement("div");
        previewItem.className = "preview-item";

        const image = document.createElement("img");
        image.alt = `Selected item photo ${index + 1}`;

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
        removeButton.textContent = "×";

        removeButton.setAttribute(
            "aria-label",
            `Remove photo ${index + 1}`
        );

        removeButton.addEventListener("click", () => {
            selectedPhotos.splice(index, 1);
            renderPhotoPreview();
        });

        previewItem.append(
            image,
            removeButton
        );

        photoPreview.appendChild(previewItem);
    });
}


/* Prevent past service dates */

const serviceDateInput =
    document.getElementById("serviceDate");


if (serviceDateInput) {
    const now = new Date();

    const localToday = new Date(
        now.getTime() -
        now.getTimezoneOffset() * 60000
    )
        .toISOString()
        .split("T")[0];

    serviceDateInput.min = localToday;
}
