import {
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


const adminLoading =
    document.getElementById("adminLoading");

const adminApplication =
    document.getElementById("adminApplication");

const adminTopName =
    document.getElementById("adminTopName");

const adminTopEmail =
    document.getElementById("adminTopEmail");

const adminProfileName =
    document.getElementById("adminProfileName");

const adminProfileEmail =
    document.getElementById("adminProfileEmail");

const adminAvatar =
    document.getElementById("adminAvatar");

const adminFirstName =
    document.getElementById("adminFirstName");

const totalRequestCount =
    document.getElementById("totalRequestCount");

const newRequestCount =
    document.getElementById("newRequestCount");

const completedRequestCount =
    document.getElementById("completedRequestCount");

const customerAccountCount =
    document.getElementById("customerAccountCount");

const requestSearch =
    document.getElementById("requestSearch");

const requestStatusFilter =
    document.getElementById("requestStatusFilter");

const requestTableBody =
    document.getElementById("requestTableBody");

const requestEmptyState =
    document.getElementById("requestEmptyState");

const customerSearch =
    document.getElementById("customerSearch");

const customerGrid =
    document.getElementById("customerGrid");

const customerEmptyState =
    document.getElementById("customerEmptyState");

const adminLogoutButton =
    document.getElementById("adminLogoutButton");

const adminToast =
    document.getElementById("adminToast");

let quoteRequests = [];
let customerAccounts = [];
let toastTimer = null;


function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function timestampMilliseconds(value) {
    if (value?.toMillis) {
        return value.toMillis();
    }

    if (value?.toDate) {
        return value.toDate().getTime();
    }

    return 0;
}


function formatTimestamp(value) {
    if (!value?.toDate) {
        return "Date unavailable";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(
        value.toDate()
    );
}


function normalizeStatus(value) {
    const allowedStatuses = [
        "new",
        "contacted",
        "scheduled",
        "completed",
        "canceled"
    ];

    return allowedStatuses.includes(value)
        ? value
        : "new";
}


function showToast(message) {
    adminToast.textContent =
        message;

    adminToast.classList.add(
        "show"
    );

    window.clearTimeout(
        toastTimer
    );

    toastTimer =
        window.setTimeout(() => {
            adminToast.classList.remove(
                "show"
            );
        }, 2800);
}


async function getAdministratorRecord(user) {
    if (
        user.uid === "lE77uZp22tbjptd1k9Nt89eOdW12"
        ||
        String(user.email || "")
            .trim()
            .toLowerCase() === "pcmovers01@gmail.com"
    ) {
        return {
            role: "admin",
            active: true,
            name: "Franklin",
            email: "pcmovers01@gmail.com"
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

    const isAdmin =
        String(roleData.role || "")
            .trim()
            .toLowerCase() === "admin"
        &&
        roleData.active === true;

    return isAdmin
        ? roleData
        : null;
}


function getAdministratorName(
    user,
    roleData
) {
    return (
        String(roleData.name || "").trim() ||
        user.displayName?.trim() ||
        user.email?.split("@")[0] ||
        "Administrator"
    );
}


function showAdministrator(
    user,
    roleData
) {
    const administratorName =
        getAdministratorName(
            user,
            roleData
        );

    const administratorEmail =
        user.email ||
        String(roleData.email || "").trim() ||
        "Administrator account";

    const firstName =
        administratorName
            .split(/\s+/)[0];

    const initial =
        administratorName
            .charAt(0)
            .toUpperCase();


    adminTopName.textContent =
        administratorName;

    adminTopEmail.textContent =
        administratorEmail;

    adminProfileName.textContent =
        administratorName;

    adminProfileEmail.textContent =
        administratorEmail;

    adminAvatar.textContent =
        initial;

    adminFirstName.textContent =
        firstName;

    adminLoading.hidden =
        true;

    adminApplication.hidden =
        false;
}


function openAdminView(viewName) {
    document
        .querySelectorAll(
            "[data-admin-section]"
        )
        .forEach((section) => {
            section.classList.toggle(
                "active",
                section.dataset.adminSection ===
                    viewName
            );
        });


    document
        .querySelectorAll(
            "[data-admin-view]"
        )
        .forEach((button) => {
            button.classList.toggle(
                "active",
                button.dataset.adminView ===
                    viewName
            );
        });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


document
    .querySelectorAll("[data-admin-view]")
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                openAdminView(
                    button.dataset.adminView
                );
            }
        );
    });


document
    .querySelectorAll(
        "[data-open-admin-view]"
    )
    .forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                openAdminView(
                    button.dataset.openAdminView
                );
            }
        );
    });


function updateStatistics() {
    totalRequestCount.textContent =
        String(
            quoteRequests.length
        );

    newRequestCount.textContent =
        String(
            quoteRequests.filter(
                (request) => {
                    return normalizeStatus(
                        request.status
                    ) === "new";
                }
            ).length
        );

    completedRequestCount.textContent =
        String(
            quoteRequests.filter(
                (request) => {
                    return normalizeStatus(
                        request.status
                    ) === "completed";
                }
            ).length
        );

    customerAccountCount.textContent =
        String(
            customerAccounts.length
        );
}


function requestMatchesFilters(request) {
    const searchText =
        requestSearch.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        requestStatusFilter.value;

    const searchableText = [
        request.fullName,
        request.phone,
        request.email,
        request.service,
        request.amount,
        request.pickup,
        request.destination,
        request.details
    ]
        .join(" ")
        .toLowerCase();

    const matchesSearch =
        !searchText ||
        searchableText.includes(
            searchText
        );

    const matchesStatus =
        selectedStatus === "all" ||
        normalizeStatus(
            request.status
        ) === selectedStatus;

    return (
        matchesSearch &&
        matchesStatus
    );
}


function statusOptions(currentStatus) {
    const statuses = [
        ["new", "New"],
        ["contacted", "Contacted"],
        ["scheduled", "Scheduled"],
        ["completed", "Completed"],
        ["canceled", "Canceled"]
    ];

    return statuses
        .map(([value, label]) => {
            const selected =
                value === normalizeStatus(
                    currentStatus
                )
                    ? "selected"
                    : "";

            return `
                <option
                    value="${value}"
                    ${selected}
                >
                    ${label}
                </option>
            `;
        })
        .join("");
}


function createRequestRow(request) {
    const status =
        normalizeStatus(
            request.status
        );

    return `
        <tr>

            <td>
                <strong>
                    ${escapeHtml(
                        request.fullName ||
                        "Customer"
                    )}
                </strong>

                <a href="tel:${escapeHtml(request.phone || "")}">
                    ${escapeHtml(
                        request.phone ||
                        "No phone"
                    )}
                </a>

                <a href="mailto:${escapeHtml(request.email || "")}">
                    ${escapeHtml(
                        request.email ||
                        "No email"
                    )}
                </a>

                <span class="admin-subtext">
                    Received
                    ${escapeHtml(
                        formatTimestamp(
                            request.createdAt
                        )
                    )}
                </span>
            </td>


            <td>
                <strong>
                    ${escapeHtml(
                        request.service ||
                        "Not selected"
                    )}
                </strong>

                <span class="admin-subtext">
                    ${escapeHtml(
                        request.amount ||
                        "Amount not provided"
                    )}
                </span>

                <span class="admin-subtext">
                    ${escapeHtml(
                        request.details ||
                        "No additional details"
                    )}
                </span>
            </td>


            <td>
                <strong>
                    ${escapeHtml(
                        request.pickup ||
                        "Pickup unavailable"
                    )}
                </strong>

                <span class="admin-subtext">
                    to
                    ${escapeHtml(
                        request.destination ||
                        "Destination unavailable"
                    )}
                </span>

                <span class="admin-subtext">
                    Preferred date:
                    ${escapeHtml(
                        request.serviceDate ||
                        "Not provided"
                    )}
                </span>
            </td>


            <td>
                <span
                    class="admin-status status-${status}"
                >
                    ${escapeHtml(status)}
                </span>

                <select
                    class="admin-select request-status-select"
                    data-request-id="${escapeHtml(request.id)}"
                    style="margin-top: 8px; min-width: 135px;"
                >
                    ${statusOptions(status)}
                </select>
            </td>


            <td>
                <div class="admin-row-actions">

                    <a
                        href="tel:${escapeHtml(request.phone || "")}"
                        class="admin-small-button"
                    >
                        Call
                    </a>

                    <a
                        href="sms:${escapeHtml(request.phone || "")}"
                        class="admin-small-button"
                    >
                        Text
                    </a>

                    <a
                        href="mailto:${escapeHtml(request.email || "")}"
                        class="admin-small-button"
                    >
                        Email
                    </a>

                    <button
                        type="button"
                        class="admin-small-button delete"
                        data-delete-request="${escapeHtml(request.id)}"
                    >
                        Delete
                    </button>

                </div>
            </td>

        </tr>
    `;
}


function renderQuoteRequests() {
    const filteredRequests =
        quoteRequests.filter(
            requestMatchesFilters
        );

    requestTableBody.innerHTML =
        filteredRequests
            .map(createRequestRow)
            .join("");

    requestEmptyState.hidden =
        filteredRequests.length > 0;

    connectRequestControls();
}


function connectRequestControls() {
    document
        .querySelectorAll(
            ".request-status-select"
        )
        .forEach((select) => {
            select.addEventListener(
                "change",
                async () => {
                    select.disabled =
                        true;

                    try {
                        await updateDoc(
                            doc(
                                db,
                                "quoteRequests",
                                select.dataset.requestId
                            ),
                            {
                                status:
                                    select.value,

                                updatedAt:
                                    serverTimestamp()
                            }
                        );

                        showToast(
                            "Request status updated."
                        );

                    } catch (error) {
                        console.error(
                            "Status update failed:",
                            error
                        );

                        showToast(
                            "The request status could not be updated."
                        );

                        select.disabled =
                            false;
                    }
                }
            );
        });


    document
        .querySelectorAll(
            "[data-delete-request]"
        )
        .forEach((button) => {
            button.addEventListener(
                "click",
                async () => {
                    const confirmed =
                        window.confirm(
                            "Delete this quote request permanently?"
                        );

                    if (!confirmed) {
                        return;
                    }

                    button.disabled =
                        true;

                    try {
                        await deleteDoc(
                            doc(
                                db,
                                "quoteRequests",
                                button.dataset
                                    .deleteRequest
                            )
                        );

                        showToast(
                            "Quote request deleted."
                        );

                    } catch (error) {
                        console.error(
                            "Request deletion failed:",
                            error
                        );

                        showToast(
                            "The quote request could not be deleted."
                        );

                        button.disabled =
                            false;
                    }
                }
            );
        });
}


function customerMatchesSearch(customer) {
    const searchText =
        customerSearch.value
            .trim()
            .toLowerCase();

    const searchableText = [
        customer.name,
        customer.email
    ]
        .join(" ")
        .toLowerCase();

    return (
        !searchText ||
        searchableText.includes(
            searchText
        )
    );
}


function renderCustomerAccounts() {
    const filteredCustomers =
        customerAccounts.filter(
            customerMatchesSearch
        );

    customerGrid.innerHTML =
        filteredCustomers
            .map((customer) => {
                const customerName =
                    customer.name ||
                    customer.email?.split("@")[0] ||
                    "Customer";

                return `
                    <article class="admin-customer">

                        <strong>
                            ${escapeHtml(customerName)}
                        </strong>

                        <a href="mailto:${escapeHtml(customer.email || "")}">
                            ${escapeHtml(
                                customer.email ||
                                "No email"
                            )}
                        </a>

                        <span>
                            Joined:
                            ${escapeHtml(
                                formatTimestamp(
                                    customer.createdAt
                                )
                            )}
                        </span>

                        <span>
                            Last login:
                            ${escapeHtml(
                                formatTimestamp(
                                    customer.lastLoginAt
                                )
                            )}
                        </span>

                    </article>
                `;
            })
            .join("");

    customerEmptyState.hidden =
        filteredCustomers.length > 0;
}


function startDatabaseListeners() {
    onSnapshot(
        collection(
            db,
            "quoteRequests"
        ),
        (snapshot) => {
            quoteRequests =
                snapshot.docs
                    .map((documentSnapshot) => {
                        return {
                            id:
                                documentSnapshot.id,

                            ...documentSnapshot.data()
                        };
                    })
                    .sort((a, b) => {
                        return (
                            timestampMilliseconds(
                                b.createdAt
                            )
                            -
                            timestampMilliseconds(
                                a.createdAt
                            )
                        );
                    });

            updateStatistics();
            renderQuoteRequests();
        },
        (error) => {
            console.error(
                "Quote request listener failed:",
                error
            );

            showToast(
                "Quote requests could not be loaded."
            );
        }
    );


    onSnapshot(
        collection(
            db,
            "customers"
        ),
        (snapshot) => {
            customerAccounts =
                snapshot.docs
                    .map((documentSnapshot) => {
                        return {
                            id:
                                documentSnapshot.id,

                            ...documentSnapshot.data()
                        };
                    })
                    .sort((a, b) => {
                        return (
                            timestampMilliseconds(
                                b.createdAt
                            )
                            -
                            timestampMilliseconds(
                                a.createdAt
                            )
                        );
                    });

            updateStatistics();
            renderCustomerAccounts();
        },
        (error) => {
            console.error(
                "Customer account listener failed:",
                error
            );

            showToast(
                "Customer accounts could not be loaded."
            );
        }
    );
}


requestSearch.addEventListener(
    "input",
    renderQuoteRequests
);

requestStatusFilter.addEventListener(
    "change",
    renderQuoteRequests
);

customerSearch.addEventListener(
    "input",
    renderCustomerAccounts
);


adminLogoutButton.addEventListener(
    "click",
    async () => {
        adminLogoutButton.disabled =
            true;

        adminLogoutButton.textContent =
            "Logging Out...";

        try {
            await signOut(auth);

            window.location.replace(
                "index.html"
            );

        } catch (error) {
            console.error(
                "Administrator logout failed:",
                error
            );

            adminLogoutButton.disabled =
                false;

            adminLogoutButton.textContent =
                "Log Out";

            showToast(
                "The administrator could not be logged out."
            );
        }
    }
);


onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            window.location.replace(
                "login.html"
            );

            return;
        }

        try {
            const roleData =
                await getAdministratorRecord(
                    user
                );

            if (!roleData) {
                window.location.replace(
                    "dashboard.html"
                );

                return;
            }

            showAdministrator(
                user,
                roleData
            );

            startDatabaseListeners();

        } catch (error) {
            console.error(
                "Administrator verification failed:",
                error
            );

            adminLoading.textContent =
                "Administrator permission could not be verified. Check that this website uses the Packaged Comfort Firebase project and that the roles document ID matches this account's UID.";
        }
    }
);
