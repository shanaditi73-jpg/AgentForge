from pydantic import BaseModel
from typing import Optional

# This is the shape of data the user sends to the API
class TaskRequest(BaseModel):
    task: str

# This is the shape of data we send back to the user
class RunResponse(BaseModel):
    id: int
    task: str
    status: str
    result: Optional[str] = None
    created_at: str
    