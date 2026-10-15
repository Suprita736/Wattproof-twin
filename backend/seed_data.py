from schemas import Appliance


APPLIANCES = [
    Appliance(
        id=1,
        name="Classroom AC",
        category="air_conditioner",
        power_watts=1800,
        hours_per_day=5,
        units=1,
        operating_days_per_week=5,
        data_source="simulated",
    ),
    Appliance(
        id=2,
        name="Classroom Lights",
        category="lighting",
        power_watts=400,
        hours_per_day=6,
        units=1,
        operating_days_per_week=5,
        data_source="simulated",
    ),
    Appliance(
        id=3,
        name="Classroom Fans",
        category="fan",
        power_watts=300,
        hours_per_day=7,
        units=1,
        operating_days_per_week=5,
        data_source="simulated",
    ),
    Appliance(
        id=4,
        name="Desktop Computers",
        category="computer",
        power_watts=600,
        hours_per_day=6,
        units=10,
        operating_days_per_week=5,
        data_source="simulated",
    ),
]