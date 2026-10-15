
from appliance_mapping import (
    map_detection,
    get_appliance_options,
    DEFAULT_POWER_WATTS,
)

detected_labels = ["tv", "laptop", "chair"]

for label in detected_labels:
    appliance = map_detection(label)

    if appliance:
        print(f"{label} -> {appliance}")
        print(
            "Illustrative default power:",
            DEFAULT_POWER_WATTS[appliance],
            "W"
        )
    else:
        print(
            f"{label} -> No appliance mapping. "
            "Manual confirmation may be needed."
        )

print("\nAvailable manual appliance options:")
print(get_appliance_options())
