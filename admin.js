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
    getStorage,
    ref
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";


const FRANKLIN_ADMIN_UID =
    "lE77uZp22tbjptd1k9Nt89eOdW12";

const storage =
    getStorage(app);

const byId = (id) =>
    document.getElementById(id);

const pageStatus = byId("pageStatus");
const application = byId("application");
const requestSearch = byId("search");
const requestFilter = byId("filter");
const requestRows = byId("rows");
const requestEmpty = byId("empty");
const customerSearch = byId("customerSearch");
const customerFilter = byId("customerFilter");
const customerRows = byId("customerRows");
const customerEmpty = byId("customerEmpty");
const customerRemovalNotice = byId("customerRemovalNotice");
const toastElement = byId("toast");

let requests = [];
let customers = [];
let toastTimer = null;

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


function formatTimestamp(value, fallback = "Unavailable") {
    const milliseconds =
        timestampMilliseconds(value);

    if (!milliseconds) {
        return fallback;
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
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


function openView(viewName) {
    const allowedViews = [
        "overview",
        "requests",
        "customers"
    ];

    const resolvedView =
        allowedViews.includes(viewName)
            ? viewName
            : "overview";

    document
        .querySelectorAll("[data-section]")
        .forEach((section) => {
            section.classList.toggle(
                "active",
                section.dataset.section === resolvedView
            );
        });

    document
        .querySelectorAll("[data-view]")
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.view === resolvedView
            );
        });

    window.history.replaceState(
        null,
        "",
        `#${resolvedView}`
    );

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


function requestOwnerUid(request) {
    return String(
        request.customerUid ||
        request.createdBy ||
        ""
    );
}


function requestsForCustomer(customerUid) {
    return requests
        .filter((request) => {
            return requestOwnerUid(request) === customerUid;
        })
        .sort((a, b) => {
            return (
                timestampMilliseconds(b.createdAt) -
                timestampMilliseconds(a.createdAt)
            );
        });
}


function customerSummary(customer) {
    const customerRequests =
        requestsForCustomer(customer.id);

    const latestRequest =
        customerRequests[0] || null;

    return {
        customerRequests,
        latestRequest,
        phone:
            customer.phone ||
            latestRequest?.phone ||
            "",
        requestCount:
            customerRequests.length,
        lastRequestAt:
            latestRequest?.createdAt || null
    };
}


function updateStatistics() {
    byId("total").textContent =
        String(requests.length);

    byId("submitted").textContent =
        String(
            requests.filter((request) => {
                return normalizeStatus(request.status) === "submitted";
            }).length
        );

    byId("scheduled").textContent =
        String(
            requests.filter((request) => {
                return normalizeStatus(request.status) === "scheduled";
            }).length
        );

    byId("customersCount").textContent =
        String(
            customers.filter((customer) => {
                return customer.archived !== true;
            }).length
        );
}


function requestMatchesFilters(request) {
    const term =
        requestSearch.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        requestFilter.value;

    const searchableText = [
        request.fullName,
        request.customerName,
        request.phone,
        request.email,
        request.service,
        request.pickup,
        request.destination
    ]
        .join(" ")
        .toLowerCase();

    return (
        (!term || searchableText.includes(term)) &&
        (
            selectedStatus === "all" ||
            normalizeStatus(request.status) === selectedStatus
        )
    );
}


function requestStatusOptions(currentStatus) {
    return [
        ["submitted", "Submitted"],
        ["under-review", "Under Review"],
        ["contacted", "Contacted"],
        ["scheduled", "Scheduled"],
        ["completed", "Completed"],
        ["canceled", "Canceled"]
    ]
        .map(([value, label]) => {
            const selected =
                value === currentStatus
                    ? "selected"
                    : "";

            return `
                <option value="${value}" ${selected}>
                    ${label}
                </option>
            `;
        })
        .join("");
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


function renderRequests() {
    const shownRequests =
        requests.filter(requestMatchesFilters);

    requestEmpty.hidden =
        shownRequests.length > 0;

    requestRows.innerHTML =
        shownRequests
            .map((request) => {
                const currentStatus =
                    normalizeStatus(request.status);

                return `
                    <tr>
                        <td>
                            <strong>${escapeHtml(request.fullName || request.customerName || "Customer")}</strong>
                            <a class="sub" href="tel:${escapeHtml(request.phone || "")}">${escapeHtml(request.phone || "No phone")}</a>
                            <a class="sub" href="mailto:${escapeHtml(request.email || "")}">${escapeHtml(request.email || "No email")}</a>
                        </td>
                        <td>
                            <strong>${escapeHtml(request.service || "Service Request")}</strong>
                            <span class="sub">${escapeHtml(request.amount || "No item summary")}</span>
                            <span class="sub">${Array.isArray(request.photoPaths) ? request.photoPaths.length : 0} photo(s)</span>
                        </td>
                        <td>
                            <strong>${escapeHtml(request.pickup || "Pickup unavailable")}</strong>
                            <span class="sub">to ${escapeHtml(request.destination || "Destination unavailable")}</span>
                        </td>
                        <td>
                            <span class="status status-${escapeHtml(currentStatus)}">${escapeHtml(statusLabels[currentStatus] || "Submitted")}</span>
                            <select class="filter-control quick-status" data-id="${escapeHtml(request.id)}" style="margin-top: 7px; min-width: 145px;">
                                ${requestStatusOptions(currentStatus)}
                            </select>
                        </td>
                        <td>
                            <div class="row-actions">
                                <a class="button button-primary" href="request-details.html?id=${encodeURIComponent(request.id)}">View / Quote</a>
                                <button class="button button-danger delete-request" data-id="${escapeHtml(request.id)}" type="button">Delete</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");

    document
        .querySelectorAll(".quick-status")
        .forEach((select) => {
            select.addEventListener(
                "change",
                async () => {
                    select.disabled = true;

                    try {
                        await updateDoc(
                            doc(
                                db,
                                "quoteRequests",
                                select.dataset.id
                            ),
                            {
                                status: select.value,
                                updatedAt: serverTimestamp()
                            }
                        );

                        showToast("Status updated.");
                    } catch (error) {
                        showToast(error.code || error.message);
                        select.disabled = false;
                    }
                }
            );
        });

    document
        .querySelectorAll(".delete-request")
        .forEach((button) => {
            button.addEventListener(
                "click",
                async () => {
                    const request =
                        requests.find((item) => {
                            return item.id === button.dataset.id;
                        });

                    if (
                        !request ||
                        !window.confirm(
                            "Delete this request and its uploaded photos permanently?"
                        )
                    ) {
                        return;
                    }

                    button.disabled = true;

                    try {
                        await deleteRequestData(request);
                        showToast("Request deleted.");
                    } catch (error) {
                        console.error(error);
                        showToast(error.code || error.message || "Request deletion failed.");
                        button.disabled = false;
                    }
                }
            );
        });
}


function customerMatchesFilters(customer) {
    const term =
        customerSearch.value
            .trim()
            .toLowerCase();

    const selectedFilter =
        customerFilter.value;

    const summary =
        customerSummary(customer);

    const searchableText = [
        customer.name,
        customer.email,
        summary.phone
    ]
        .join(" ")
        .toLowerCase();

    const matchesArchiveFilter =
        selectedFilter === "all" ||
        (
            selectedFilter === "archived"
                ? customer.archived === true
                : customer.archived !== true
        );

    return (
        matchesArchiveFilter &&
        (!term || searchableText.includes(term))
    );
}


function showRemovalReminder(customerUid) {
    const intro =
        document.createTextNode(
            "Customer website data removed. Now delete this UID from Firebase Authentication:"
        );

    const code =
        document.createElement("code");

    code.textContent =
        customerUid;

    customerRemovalNotice.replaceChildren(
        intro,
        document.createElement("br"),
        code
    );

    customerRemovalNotice.hidden =
        false;

    customerRemovalNotice.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


async function removeCustomer(customerUid, button) {
    const customer =
        customers.find((item) => {
            return item.id === customerUid;
        });

    if (!customer) {
        showToast("This customer could not be found.");
        return;
    }

    const customerRequests =
        requestsForCustomer(customerUid);

    const customerName =
        customer.name ||
        customer.email ||
        "this customer";

    const confirmed =
        window.confirm(
            `Permanently remove ${customerName}'s Firestore profile, ${customerRequests.length} request(s), and uploaded photos? Their Firebase Authentication login must still be deleted manually.`
        );

    if (!confirmed) {
        return;
    }

    button.disabled = true;
    button.textContent = "Removing...";

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

        showRemovalReminder(customerUid);
        showToast("Customer website data removed.");
    } catch (error) {
        console.error(error);
        showToast(error.code || error.message || "Customer removal failed.");
        button.disabled = false;
        button.textContent = "Remove Customer";
    }
}


function renderCustomers() {
    const shownCustomers =
        customers
            .filter(customerMatchesFilters)
            .sort((a, b) => {
                const aTime =
                    timestampMilliseconds(
                        customerSummary(a).lastRequestAt ||
                        a.createdAt
                    );

                const bTime =
                    timestampMilliseconds(
                        customerSummary(b).lastRequestAt ||
                        b.createdAt
                    );

                return bTime - aTime;
            });

    customerEmpty.hidden =
        shownCustomers.length > 0;

    customerRows.innerHTML =
        shownCustomers
            .map((customer) => {
                const summary =
                    customerSummary(customer);

                const customerName =
                    customer.name ||
                    customer.email?.split("@")[0] ||
                    "Customer";

                const archiveBadge =
                    customer.archived === true
                        ? '<span class="badge badge-archived">Archived</span>'
                        : '<span class="badge badge-active">Active</span>';

                const emailAction =
                    customer.email
                        ? `<a class="button" href="mailto:${escapeHtml(customer.email)}">Email</a>`
                        : '<span class="button" aria-disabled="true">No Email</span>';

                return `
                    <tr class="${customer.archived === true ? "is-archived" : ""}">
                        <td>
                            <div class="customer-name">
                                <strong>${escapeHtml(customerName)}</strong>
                                ${archiveBadge}
                            </div>
                            <span class="sub">UID: ${escapeHtml(customer.id)}</span>
                        </td>
                        <td>
                            <a href="mailto:${escapeHtml(customer.email || "")}">${escapeHtml(customer.email || "No email")}</a>
                        </td>
                        <td>
                            <a href="tel:${escapeHtml(summary.phone)}">${escapeHtml(summary.phone || "No phone")}</a>
                        </td>
                        <td>${escapeHtml(formatTimestamp(customer.createdAt))}</td>
                        <td>${summary.requestCount}</td>
                        <td>${escapeHtml(formatTimestamp(summary.lastRequestAt, "No requests"))}</td>
                        <td>
                            <div class="row-actions">
                                <a class="button button-primary" href="customer-profile.html?uid=${encodeURIComponent(customer.id)}">View Profile</a>
                                ${emailAction}
                                <button class="button button-danger remove-customer" data-customer-uid="${escapeHtml(customer.id)}" type="button">Remove Customer</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join("");

    document
        .querySelectorAll(".remove-customer")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    removeCustomer(
                        button.dataset.customerUid,
                        button
                    );
                }
            );
        });
}


async function getAdministratorRecord(user) {
    if (user.uid === FRANKLIN_ADMIN_UID) {
        return {
            role: "admin",
            active: true,
            name: "Franklin",
            email: user.email || ""
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


function showAdministrator(user, roleData) {
    const name =
        String(roleData.name || "").trim() ||
        user.displayName?.trim() ||
        "Franklin";

    const email =
        user.email ||
        String(roleData.email || "").trim() ||
        "Administrator";

    byId("topName").textContent = name;
    byId("profileName").textContent = name;
    byId("profileEmail").textContent = email;
    byId("profileAvatar").textContent = name.charAt(0).toUpperCase();
    byId("firstName").textContent = name.split(/\s+/)[0];

    pageStatus.className =
        "status-box success";

    pageStatus.textContent =
        "Administrator access verified.";

    application.hidden =
        false;
}


function startDatabaseListeners() {
    onSnapshot(
        collection(db, "quoteRequests"),
        (snapshot) => {
            requests =
                snapshot.docs
                    .map((documentSnapshot) => {
                        return {
                            id: documentSnapshot.id,
                            ...documentSnapshot.data()
                        };
                    })
                    .sort((a, b) => {
                        return (
                            timestampMilliseconds(b.createdAt) -
                            timestampMilliseconds(a.createdAt)
                        );
                    });

            updateStatistics();
            renderRequests();
            renderCustomers();
        },
        (error) => {
            console.error(error);
            showToast(error.code || error.message);
        }
    );

    onSnapshot(
        collection(db, "customers"),
        (snapshot) => {
            customers =
                snapshot.docs.map((documentSnapshot) => {
                    return {
                        id: documentSnapshot.id,
                        ...documentSnapshot.data()
                    };
                });

            updateStatistics();
            renderCustomers();
        },
        (error) => {
            console.error(error);
            showToast(error.code || error.message);
        }
    );
}


document
    .querySelectorAll("[data-view]")
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                openView(button.dataset.view);
            }
        );
    });

document
    .querySelectorAll("[data-open]")
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                openView(button.dataset.open);
            }
        );
    });

requestSearch.addEventListener(
    "input",
    renderRequests
);

requestFilter.addEventListener(
    "change",
    renderRequests
);

customerSearch.addEventListener(
    "input",
    renderCustomers
);

customerFilter.addEventListener(
    "change",
    renderCustomers
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

        try {
            const roleData =
                await getAdministratorRecord(user);

            if (!roleData) {
                window.location.replace("dashboard.html");
                return;
            }

            showAdministrator(user, roleData);
            openView(
                window.location.hash.slice(1) ||
                "overview"
            );
            startDatabaseListeners();
        } catch (error) {
            console.error(error);
            pageStatus.className = "status-box error";
            pageStatus.textContent =
                "Administrator permission could not be verified. Check the Firebase project and administrator role document.";
        }
    }
);
