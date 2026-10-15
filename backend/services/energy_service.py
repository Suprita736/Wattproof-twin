from seed_data import APPLIANCES

# Prototype configuration
TARIFF_PER_KWH = 8.0
GRID_EMISSION_FACTOR = 0.7  # kg CO2 per kWh


def calculate_daily_energy(power_watts, hours_per_day, units):
    return (power_watts * hours_per_day * units) / 1000


def calculate_weekly_energy(
    power_watts,
    hours_per_day,
    units,
    operating_days_per_week
):
    daily_energy = calculate_daily_energy(
        power_watts,
        hours_per_day,
        units
    )

    return daily_energy * operating_days_per_week


def get_energy_summary():
    total_daily_energy = 0
    total_weekly_energy = 0
    equipment_breakdown = []

    for appliance in APPLIANCES:
        daily_energy = calculate_daily_energy(
            appliance.power_watts,
            appliance.hours_per_day,
            appliance.units
        )

        weekly_energy = calculate_weekly_energy(
            appliance.power_watts,
            appliance.hours_per_day,
            appliance.units,
            appliance.operating_days_per_week
        )

        total_daily_energy += daily_energy
        total_weekly_energy += weekly_energy

        equipment_breakdown.append({
            "appliance_id": appliance.id,
            "name": appliance.name,
            "daily_energy_kwh": round(daily_energy, 2),
            "weekly_energy_kwh": round(weekly_energy, 2)
        })

    estimated_daily_cost = total_daily_energy * TARIFF_PER_KWH
    estimated_daily_emissions = (
        total_daily_energy * GRID_EMISSION_FACTOR
    )

    return {
        "total_daily_energy_kwh": round(total_daily_energy, 2),
        "total_weekly_energy_kwh": round(total_weekly_energy, 2),
        "estimated_daily_cost": round(estimated_daily_cost, 2),
        "estimated_daily_co2_kg": round(estimated_daily_emissions, 2),
        "equipment_breakdown": equipment_breakdown,
        "data_source": "simulated"
    }