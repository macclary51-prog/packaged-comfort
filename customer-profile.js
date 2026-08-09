import {
    app,
    auth,
    db
} from "./firebase-config.js?v=31";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";


const FRANKLIN_ADMIN_UID =
    "lE77uZp22tbjptd1k9Nt89eOdW12";

const customerUid =
    new URLSearchParams(window.location.search)
        .get("uid");

const storage =
    getStorage(app);

const byId = (id) =>
    document.getElementById(id);

const pageStatus = byId("pageStatus");
const profileContent = byId("profileContent");
const removalResult = byId("removalResult");
const notesForm = byId("notesForm");
const notesField = byId("customerNotes");
const historyFilter = byId("historyFilter");
const requestHistory = byId("requestHistory");
const requestHistoryEmpty = byId("requestHistoryEmpty");
const toastElement = byId("toast");

let currentCustomer = null;
let customerRequests = [];
let toastTimer = null;
let notesAreDirty = false;
let photoRenderToken = 0;
let removingCustomer = false;

const statusLabels = {
    new: "Submitted",
    submitted: "Submitted",
    "under-review": "Under Review",
    contacted: "Contacted",
    scheduled: "Scheduled",
    completed: "Completed",
    canceled: "Canceled"
};


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function normalizeStatus(value) {
    return value === "new"
        ? "submitted"
        : value || "submitted";
}


function statusGroup(value) {
    const status =
        normalizeStatus(value);

    if (status === "completed") {
        return "completed";
    }

    if (status === "canceled") {
        return "canceled";
    }

    return "active";
}


function timestampMilliseconds(value) {
    if (value?.toMillis) {
        return value.toMillis();
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    const parsed =
        Date.parse(value || "");

    return Number.isNaN(parsed)
        ? 0
        : parsed;
}


function formatTimestamp(
    value,
    fallback = "Unavailable",
    includeTime = false
) {
    const milliseconds =
        timestampMilliseconds(value);

    if (!milliseconds) {
        return fallback;
    }

    const options = {
        month: "short",
        day: "numeric",
        year: "numeric"
    };

    if (includeTime) {
        options.hour = "numeric";
        options.minute = "2-digit";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        options
    ).format(milliseconds);
}


function showToast(message) {
    toastElement.textContent =
        message;

    toastElement.classList.add("show");

    window.clearTimeout(toastTimer);

    toastTimer =
        window.setTimeout(() => {
            toastElement.classList.remove("show");
        }, 3000);
}


function showError(message) {
    pageStatus.className =
        "status-box error";

    pageStatus.textContent =
        message;
}


function requestOwnerUid(request) {
    return String(
        request.customerUid ||
        request.createdBy ||
        ""
    );
}


function latestRequest() {
    return customerRequests[0] || null;
}


function customerName() {
    return (
        currentCustomer?.name ||
        currentCustomer?.email?.split("@")[0] ||
        latestRequest()?.fullName ||
        latestRequest()?.customerName ||
        "Customer"
    );
}


function customerEmail() {
    return (
        currentCustomer?.email ||
        latestRequest()?.email ||
        ""
    );
}


function customerPhone() {
    return (
        currentCustomer?.phone ||
        latestRequest()?.phone ||
        ""
    );
}


function renderContactDetails() {
    const details = [
        ["Email", customerEmail() || "No email"],
        ["Phone", customerPhone() || "No phone"],
        ["Joined", formatTimestamp(currentCustomer?.createdAt)],
        ["Last request", formatTimestamp(latestRequest()?.createdAt, "No requests")],
        ["Account status", currentCustomer?.archived === true ? "Archived" : "Active"],
        ["Firebase UID", customerUid]
    ];

    byId("contactDetails").innerHTML =
        details
            .map(([label, value]) => {
                return `
                    <div class="detail">
                        <span>${escapeHtml(label)}</span>
                        <strong>${escapeHtml(value)}</strong>
                    </div>
                `;
            })
            .join("");
}


function renderCustomer() {
    if (!currentCustomer) {
        return;
    }

    const name =
        customerName();

    const email =
        customerEmail();

    const phone =
        customerPhone();

    document.title =
        `${name} | Packaged Comfort`;

    byId("customerName").textContent =
        name;

    byId("customerSummary").textContent =
        currentCustomer.archived === true
            ? `${email || "No email"} · Archived customer · UID ${customerUid}`
            : `${email || "No email"} · Active customer · UID ${customerUid}`;

    byId("callCustomer").href =
        phone
            ? `tel:${phone}`
            : "#";

    byId("callCustomer").textContent =
        phone
            ? "Call Customer"
            : "No Phone";

    byId("emailCustomer").href =
        email
            ? `mailto:${email}`
            : "#";

    byId("emailCustomer").textContent =
        email
            ? "Email Customer"
            : "No Email";

    byId("archiveCustomer").textContent =
        currentCustomer.archived === true
            ? "Restore Customer"
            : "Archive Customer";

    if (!notesAreDirty) {
        notesField.value =
            currentCustomer.adminNotes || "";
    }

    byId("notesUpdated").textContent =
        currentCustomer.adminNotesUpdatedAt
            ? `Last saved ${formatTimestamp(currentCustomer.adminNotesUpdatedAt, "", true)}`
            : "No notes saved yet.";

    pageStatus.className =
        "status-box success";

    pageStatus.textContent =
        "Administrator access verified. Customer profile loaded.";

    profileContent.hidden =
        false;

    renderContactDetails();
}


function renderStatistics() {
    byId("totalRequests").textContent =
        String(customerRequests.length);

    byId("activeRequests").textContent =
        String(
            customerRequests.filter((request) => {
                return statusGroup(request.status) === "active";
            }).length
        );

    byId("completedRequests").textContent =
        String(
            customerRequests.filter((request) => {
                return statusGroup(request.status) === "completed";
            }).length
        );

    byId("canceledRequests").textContent =
        String(
            customerRequests.filter((request) => {
                return statusGroup(request.status) === "canceled";
            }).length
        );
}


async function populatePhotoGallery(
    gallery,
    paths,
    renderToken
) {
    if (!paths.length) {
        const empty =
            document.createElement("span");

        empty.className =
            "sub";

        empty.textContent =
            "No photos uploaded.";

        gallery.replaceWith(empty);
        return;
    }

    for (const path of paths) {
        try {
            const url =
                await getDownloadURL(
                    ref(storage, path)
                );

            if (renderToken !== photoRenderToken) {
                return;
            }

            const link =
                document.createElement("a");

            const image =
                document.createElement("img");

            link.href = url;
            link.target = "_blank";
            link.rel = "noopener";
            image.src = url;
            image.alt = "Customer upload";
            link.appendChild(image);
            gallery.appendChild(link);
        } catch (error) {
            console.error(error);
        }
    }

    if (!gallery.children.length) {
        const empty =
            document.createElement("span");

        empty.className =
            "sub";

        empty.textContent =
            "Photos could not be loaded.";

        gallery.replaceWith(empty);
    }
}


function renderRequestHistory() {
    const selectedFilter =
        historyFilter.value;

    const shownRequests =
        customerRequests.filter((request) => {
            return (
                selectedFilter === "all" ||
                statusGroup(request.status) === selectedFilter
            );
        });

    requestHistoryEmpty.hidden =
        shownRequests.length > 0;

    requestHistory.innerHTML =
        shownRequests
            .map((request, index) => {
                const status =
                    normalizeStatus(request.status);

                const photoCount =
                    Array.isArray(request.photoPaths)
                        ? request.photoPaths.length
                        : 0;

                return `
                    <article class="request-card">
                        <div class="request-card-head">
                            <div>
                                <span class="status status-${escapeHtml(status)}">${escapeHtml(statusLabels[status] || "Submitted")}</span>
                                <h3>${escapeHtml(request.service || "Service Request")}</h3>
                                <span class="sub">Request ${escapeHtml(request.id.slice(0, 8).toUpperCase())}</span>
                            </div>
                            <a class="button button-primary" href="request-details.html?id=${encodeURIComponent(request.id)}">Open Request</a>
                        </div>

                        <div class="request-meta">
                            <div>
                                <span>Submitted</span>
                                <strong>${escapeHtml(formatTimestamp(request.createdAt))}</strong>
                            </div>
                            <div>
                                <span>Route</span>
                                <strong>${escapeHtml(request.pickup || "Pickup unavailable")} → ${escapeHtml(request.destination || "Destination unavailable")}</strong>
                            </div>
                            <div>
                                <span>Photos</span>
                                <strong>${photoCount}</strong>
                            </div>
                        </div>

                        <p>${escapeHtml(request.details || request.amount || "No additional request details.")}</p>
                        <div class="photos" data-photo-gallery="${index}"></div>
                    </article>
                `;
            })
            .join("");

    const renderToken =
        ++photoRenderToken;

    shownRequests.forEach((request, index) => {
        const gallery =
            requestHistory.querySelector(
                `[data-photo-gallery="${index}"]`
            );

        if (gallery) {
            populatePhotoGallery(
                gallery,
                Array.isArray(request.photoPaths)
                    ? request.photoPaths
                    : [],
                renderToken
            );
        }
    });
}


async function deleteRequestData(request) {
    for (const path of request.photoPaths || []) {
        try {
            await deleteObject(
                ref(storage, path)
            );
        } catch (error) {
            if (error.code !== "storage/object-not-found") {
                throw error;
            }
        }
    }

    await deleteDoc(
        doc(
            db,
            "quoteRequests",
            request.id
        )
    );
}


function showRemovalResult() {
    const intro =
        document.createTextNode(
            "Customer website data removed. Now delete this UID from Firebase Authentication:"
        );

    const code =
        document.createElement("code");

    const back =
        document.createElement("a");

    code.textContent = customerUid;
    back.href = "admin.html#customers";
    back.className = "button";
    back.style.marginTop = "12px";
    back.textContent = "Return to Customers";

    removalResult.replaceChildren(
        intro,
        document.createElement("br"),
        code,
        document.createElement("br"),
        back
    );

    removalResult.hidden = false;
    profileContent.hidden = true;
    pageStatus.hidden = true;
}


async function removeCustomerData() {
    const confirmed =
        window.confirm(
            `Permanently remove ${customerName()}'s Firestore profile, ${customerRequests.length} request(s), and uploaded photos? Their Firebase Authentication login must still be deleted manually.`
        );

    if (!confirmed) {
        return;
    }

    const removeButton =
        byId("removeCustomer");

    removeButton.disabled = true;
    removeButton.textContent = "Removing...";
    removingCustomer = true;

    try {
        for (const request of customerRequests) {
            await deleteRequestData(request);
        }

        await deleteDoc(
            doc(
                db,
                "customers",
                customerUid
            )
        );

        showRemovalResult();
        showToast("Customer website data removed.");
    } catch (error) {
        console.error(error);
        removingCustomer = false;
        removeButton.disabled = false;
        removeButton.textContent = "Remove Customer";
        showToast(error.code || error.message || "Customer removal failed.");
    }
}


async function getAdministratorRecord(user) {
    if (user.uid === FRANKLIN_ADMIN_UID) {
        return {
            role: "admin",
            active: true
        };
    }

    const roleSnapshot =
        await getDoc(
            doc(
                db,
                "roles",
                user.uid
            )
        );

    if (!roleSnapshot.exists()) {
        return null;
    }

    const roleData =
        roleSnapshot.data();

    return (
        String(roleData.role || "")
            .trim()
            .toLowerCase() === "admin" &&
        roleData.active === true
    )
        ? roleData
        : null;
}


function startCustomerListeners() {
    onSnapshot(
        doc(db, "customers", customerUid),
        (snapshot) => {
            if (!snapshot.exists()) {
                if (!removingCustomer) {
                    showError("This customer profile was not found.");
                }
                return;
            }

            currentCustomer = {
                id: snapshot.id,
                ...snapshot.data()
            };

            renderCustomer();
        },
        (error) => {
            console.error(error);
            showError(`Customer profile could not load: ${error.code || error.message}`);
        }
    );

    onSnapshot(
        collection(db, "quoteRequests"),
        (snapshot) => {
            customerRequests =
                snapshot.docs
                    .map((documentSnapshot) => {
                        return {
                            id: documentSnapshot.id,
                            ...documentSnapshot.data()
                        };
                    })
                    .filter((request) => {
                        return requestOwnerUid(request) === customerUid;
                    })
                    .sort((a, b) => {
                        return (
                            timestampMilliseconds(b.createdAt) -
                            timestampMilliseconds(a.createdAt)
                        );
                    });

            renderStatistics();
            renderRequestHistory();

            if (currentCustomer) {
                renderCustomer();
            }
        },
        (error) => {
            console.error(error);
            showToast(error.code || error.message);
        }
    );
}


notesField.addEventListener(
    "input",
    () => {
        notesAreDirty = true;
    }
);

notesForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        if (!currentCustomer) {
            return;
        }

        const saveButton =
            byId("saveNotes");

        saveButton.disabled = true;

        try {
            await updateDoc(
                doc(
                    db,
                    "customers",
                    customerUid
                ),
                {
                    adminNotes: notesField.value.trim(),
                    adminNotesUpdatedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            );

            notesAreDirty = false;
            showToast("Private notes saved.");
        } catch (error) {
            console.error(error);
            showToast(error.code || error.message || "Notes could not be saved.");
        } finally {
            saveButton.disabled = false;
        }
    }
);

historyFilter.addEventListener(
    "change",
    renderRequestHistory
);

byId("archiveCustomer").addEventListener(
    "click",
    async () => {
        if (!currentCustomer) {
            return;
        }

        const archiveButton =
            byId("archiveCustomer");

        const archived =
            currentCustomer.archived !== true;

        archiveButton.disabled = true;

        try {
            await updateDoc(
                doc(
                    db,
                    "customers",
                    customerUid
                ),
                {
                    archived,
                    archivedAt:
                        archived
                            ? serverTimestamp()
                            : null,
                    updatedAt: serverTimestamp()
                }
            );

            showToast(
                archived
                    ? "Customer archived."
                    : "Customer restored."
            );
        } catch (error) {
            console.error(error);
            showToast(error.code || error.message || "Customer status could not be updated.");
        } finally {
            archiveButton.disabled = false;
        }
    }
);

byId("removeCustomer").addEventListener(
    "click",
    removeCustomerData
);

byId("logout").addEventListener(
    "click",
    async () => {
        await signOut(auth);
        window.location.replace("login.html");
    }
);


onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.replace("login.html");
            return;
        }

        if (!customerUid) {
            showError("No customer UID was provided.");
            return;
        }

        try {
            const roleData =
                await getAdministratorRecord(user);

            if (!roleData) {
                window.location.replace("dashboard.html");
                return;
            }

            startCustomerListeners();
        } catch (error) {
            console.error(error);
            showError("Administrator permission could not be verified.");
        }
    }
);
