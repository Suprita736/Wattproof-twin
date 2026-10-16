const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "https://wattproof-backend.onrender.com";

const CV_URL =
    import.meta.env.VITE_CV_URL || "http://127.0.0.1:8001";

// Remove trailing slash if accidentally added in the environment variable
const API = BACKEND_URL.replace(/\/$/, "");
const CV = CV_URL.replace(/\/$/, "");

// Helper to handle API responses and errors
async function handleResponse(response) {
    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `API error (${response.status}): ${errorText || response.statusText
            }`
        );
    }

    return response.json();
}


// ---------------------------------------------------------------------
// Computer Vision
// ---------------------------------------------------------------------

// Detect equipment from an uploaded image using the CV service
export async function detectEquipment(imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(`${CV}/api/detect`, {
        method: "POST",
        body: formData,
    });

    return handleResponse(response);
}


// ---------------------------------------------------------------------
// Equipment / Appliances
// ---------------------------------------------------------------------

// Fetch all equipment
export async function getEquipment() {
    const response = await fetch(`${API}/api/appliances/`);

    return handleResponse(response);
}

// Create and save an equipment record
export async function createEquipment(item) {
    const response = await fetch(`${API}/api/appliances/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}

// Update equipment
export async function updateEquipment(id, item) {
    const response = await fetch(`${API}/api/appliances/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}

// Delete equipment
export async function deleteEquipment(id) {
    const response = await fetch(`${API}/api/appliances/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `API error (${response.status}): ${errorText || response.statusText
            }`
        );
    }
}


// ---------------------------------------------------------------------
// Energy
// ---------------------------------------------------------------------

export async function getEnergySummary() {
    const response = await fetch(`${API}/api/energy/summary`);

    return handleResponse(response);
}


// ---------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------

export async function runSimulation(applianceId, reductionPercent) {
    const response = await fetch(`${API}/api/simulation/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            appliance_id: applianceId,
            reduction_percent: reductionPercent,
        }),
    });

    return handleResponse(response);
}


// ---------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------

export async function createAction(item) {
    const response = await fetch(`${API}/api/actions/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}

export async function getActions() {
    const response = await fetch(`${API}/api/actions/`);

    return handleResponse(response);
}

export async function verifyAction(actionId, observedEnergyKwh) {
    const response = await fetch(
        `${API}/api/actions/${actionId}/verify`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                observed_energy_kwh: observedEnergyKwh,
            }),
        }
    );

    return handleResponse(response);
}


// ---------------------------------------------------------------------
// Action Passports
// ---------------------------------------------------------------------

async function passportResponse(response) {
    if (response.ok) {
        return response.json();
    }

    let message = response.statusText || "Request failed";

    try {
        const body = await response.json();

        if (typeof body.detail === "string") {
            message = body.detail;
        } else if (Array.isArray(body.detail)) {
            message = body.detail
                .map((item) =>
                    item.msg.replace(/^Value error, /, "")
                )
                .join("; ");
        }
    } catch {
        // Keep default message
    }

    throw new Error(message);
}

export async function createPassport(passport) {
    const response = await fetch(`${API}/api/passports/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(passport),
    });

    return passportResponse(response);
}

export async function getPassports() {
    const response = await fetch(`${API}/api/passports/`);

    return passportResponse(response);
}

export async function addPassportReading(passportId, reading) {
    const response = await fetch(
        `${API}/api/passports/${passportId}/readings`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(reading),
        }
    );

    return passportResponse(response);
}


// ---------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------

export async function getDiagnosis() {
    const response = await fetch(`${API}/api/diagnosis/`);

    return passportResponse(response);
}

export async function saveOccupancy(settings) {
    const response = await fetch(
        `${API}/api/diagnosis/occupancy`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(settings),
        }
    );

    return passportResponse(response);
}


// ---------------------------------------------------------------------
// AI Advisor
// ---------------------------------------------------------------------

export async function getAdvisorStatus() {
    const response = await fetch(`${API}/api/advisor/status`);

    return passportResponse(response);
}

// messages: [{ role: "user" | "assistant", content: "..." }]
export async function askAdvisor(messages) {
    const response = await fetch(`${API}/api/advisor/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
    });

    return passportResponse(response);
}