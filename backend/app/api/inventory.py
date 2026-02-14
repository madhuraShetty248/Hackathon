from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.inventory import InventoryItem
from app.api.workspaces import _get_workspace_access, require_owner
from app.auth import get_current_user
from app.schemas import InventoryItemCreate, InventoryItemUpdate

router = APIRouter(prefix="/workspaces", tags=["inventory"])

@router.get("/{workspace_id}/inventory")
def list_inventory(workspace_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    items = db.query(InventoryItem).filter(InventoryItem.workspace_id == workspace_id).all()
    return [{
        "id": i.id,
        "name": i.name,
        "quantity": i.quantity,
        "unit": i.unit,
        "low_stock_threshold": i.low_stock_threshold,
        "is_low": i.quantity <= i.low_stock_threshold
    } for i in items]

@router.post("/{workspace_id}/inventory")
def create_inventory_item(workspace_id: int, data: InventoryItemCreate, user: User = Depends(require_owner), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    item = InventoryItem(
        workspace_id=workspace_id,
        name=data.name,
        quantity=data.quantity,
        unit=data.unit,
        low_stock_threshold=data.low_stock_threshold,
        quantity_per_booking=data.quantity_per_booking
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "name": item.name}

@router.patch("/{workspace_id}/inventory/{item_id}")
def update_inventory_item(workspace_id: int, item_id: int, data: InventoryItemUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _get_workspace_access(workspace_id, user, db)
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.workspace_id == workspace_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if data.quantity is not None:
        item.quantity = data.quantity
    if data.low_stock_threshold is not None:
        item.low_stock_threshold = data.low_stock_threshold
    db.commit()
    return {"id": item.id, "quantity": item.quantity}
