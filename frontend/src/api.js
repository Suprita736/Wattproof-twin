
const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const CV_URL =
    import.meta.env.VITE_CV_URL || "http://127.0.0.1:8001";

// Helper to handle API responses and errors
async function handleResponse(response) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `API error (${response.status}): ${errorText || response.statusText}`
        );
    }

    return response.json();
}

// Detect equipment from an uploaded image using the CV service
export async function detectEquipment(imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(`${CV_URL}/api/detect`, {
        method: "POST",
        body: formData,
    });

    return handleResponse(response);
}

// Fetch all equipment from the main backend
export async function getEquipment() {
    const response = await fetch(`${BACKEND_URL}/api/appliances/`);

    return handleResponse(response);
}

// Create and save an equipment record
export async function createEquipment(item) {
    const response = await fetch(`${BACKEND_URL}/api/appliances/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}

export async function getEnergySummary() {
    const response = await fetch(`${BACKEND_URL}/api/energy/summary`);
    return handleResponse(response);
}

export async function updateEquipment(id, item) {
    const response = await fetch(`${BACKEND_URL}/api/appliances/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}


export async function deleteEquipment(id) {
    const response = await fetch(`${BACKEND_URL}/api/appliances/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `API error (${response.status}): ${errorText || response.statusText}`
        );
    }
}


// Run a simulation for a saved appliance
export async function runSimulation(applianceId, reductionPercent) {
    const response = await fetch(`${BACKEND_URL}/api/simulation/`, {
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

// Save a simulated action (this is the passport record for now)
export async function createAction(item) {
    const response = await fetch(`${BACKEND_URL}/api/actions/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
    });

    return handleResponse(response);
}

export async function getActions() {
    const response = await fetch(`${BACKEND_URL}/api/actions/`);
    return handleResponse(response);
}

// Compare a measured reading against the prediction
export async function verifyAction(actionId, observedEnergyKwh) {
    const response = await fetch(
        `${BACKEND_URL}/api/actions/${actionId}/verify`,
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

// Turns FastAPI error bodies into a short, readable message.
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
                .map((item) => item.msg.replace(/^Value error, /, ""))
                .join("; ");
        }
    } catch {
        // Keep the default message.
    }

    throw new Error(message);
}

export async function createPassport(passport) {
    const response = await fetch(`${BACKEND_URL}/api/passports/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passport),
    });

    return passportResponse(response);
}

export async function getPassports() {
    const response = await fetch(`${BACKEND_URL}/api/passports/`);
    return passportResponse(response);
}

// Record a follow-up reading and get the updated passport back
export async function addPassportReading(passportId, reading) {
    const response = await fetch(
        `${BACKEND_URL}/api/passports/${passportId}/readings`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reading),
        }
    );

    return passportResponse(response);
}


// ---------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------

export async function getDiagnosis() {
    const response = await fetch(`${BACKEND_URL}/api/diagnosis/`);
    return passportResponse(response);
}

export async function saveOccupancy(settings) {
    const response = await fetch(`${BACKEND_URL}/api/diagnosis/occupancy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
    });

    return passportResponse(response);
}


// ---------------------------------------------------------------------
// AI advisor
// ---------------------------------------------------------------------

export async function getAdvisorStatus() {
    const response = await fetch(`${BACKEND_URL}/api/advisor/status`);
    return passportResponse(response);
}

// messages: [{ role: "user" | "assistant", content: "..." }]
export async function askAdvisor(messages) {
    const response = await fetch(`${BACKEND_URL}/api/advisor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
    });

    return passportResponse(response);
}