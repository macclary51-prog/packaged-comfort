
"use strict";

const menuButton = document.getElementById("menuButton");
const mainNav = document.getElementById("mainNav");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
let toastTimer;

if (menuButton && mainNav) {
    menuButton.addEventListener("click", () => {
        const open = mainNav.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", (event) => {
        if (!mainNav.contains(event.target) && !menuButton.contains(event.target)) {
            mainNav.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
        }
    });
}

document.querySelectorAll("[data-current-year]").forEach((item) => {
    item.textContent = new Date().getFullYear();
});

function showToast(message) {
    if (!toast || !toastMessage) return;

    window.clearTimeout(toastTimer);
    toastMessage.textContent = message;
    toast.classList.add("show");

    toastTimer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 4200);
}

document.querySelectorAll("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        showToast("This page is ready. Firebase will make it fully functional.");
        form.reset();
    });
});

const photoInput = document.getElementById("movingPhotos");
const photoPreview = document.getElementById("photoPreview");
let selectedPhotos = [];

if (photoInput && photoPreview) {
    photoInput.addEventListener("change", (event) => {
        const files = Array.from(event.target.files).filter((file) =>
            file.type.startsWith("image/")
        );

        selectedPhotos = [...selectedPhotos, ...files].slice(0, 12);
        renderPhotoPreview();
    });
}

function renderPhotoPreview() {
    if (!photoPreview) return;

    photoPreview.innerHTML = "";

    selectedPhotos.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "preview-item";

        const image = document.createElement("img");
        const objectUrl = URL.createObjectURL(file);
        image.src = objectUrl;
        image.alt = `Selected photo ${index + 1}`;
        image.onload = () => URL.revokeObjectURL(objectUrl);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", `Remove photo ${index + 1}`);
        removeButton.addEventListener("click", () => {
            selectedPhotos.splice(index, 1);
            renderPhotoPreview();
        });

        item.append(image, removeButton);
        photoPreview.appendChild(item);
    });
}

const serviceDate = document.getElementById("serviceDate");

if (serviceDate) {
    const now = new Date();
    serviceDate.min = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
    ).toISOString().split("T")[0];
}
