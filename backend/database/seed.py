from sqlalchemy.orm import Session

from database.models import ApplianceDB
from seed_data import APPLIANCES


def seed_appliances(db: Session):
    if db.query(ApplianceDB).count() > 0:
        return

    for item in APPLIANCES:
        appliance = ApplianceDB(**item.model_dump())
        db.add(appliance)

    db.commit()