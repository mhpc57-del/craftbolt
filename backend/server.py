from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import httpx
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'craftbolt-secret-key-2026')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="CraftBolt API")

# Uploads directory
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Create routers
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserRole:
    CUSTOMER = "customer"
    SUPPLIER = "supplier"
    ADMIN = "admin"

class SupplierType:
    OSVC = "osvc"  # 490 Kč
    NEPODNIKATEL = "nepodnikatel"  # 290 Kč
    COMPANY = "company"  # 490 Kč (same as OSVC)

class UserBase(BaseModel):
    email: EmailStr
    phone: str
    role: str  # customer, supplier, admin
    
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    phone: str
    role: str
    supplier_type: Optional[str] = None  # osvc, nepodnikatel, company
    company_name: Optional[str] = None
    ico: Optional[str] = None
    dic: Optional[str] = None
    address: Optional[str] = None
    branch_address: Optional[str] = None
    profile_image: Optional[str] = None
    categories: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    phone: str
    role: str
    supplier_type: Optional[str] = None
    company_name: Optional[str] = None
    ico: Optional[str] = None
    dic: Optional[str] = None
    address: Optional[str] = None
    branch_address: Optional[str] = None
    profile_image: Optional[str] = None
    categories: List[str] = []
    is_verified: bool = False
    trial_ends_at: Optional[str] = None
    subscription_active: bool = False
    created_at: str
    rating: float = 0.0
    reviews_count: int = 0
    location: Optional[dict] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class DemandCreate(BaseModel):
    title: str
    description: str
    category: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    payment_method: str = "cash"  # cash, card, transfer

class DemandResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    category: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    payment_method: Optional[str] = "cash"
    status: str  # open, in_progress, completed, cancelled
    customer_id: str
    customer_name: Optional[str] = None
    assigned_supplier_id: Optional[str] = None
    assigned_supplier_name: Optional[str] = None
    created_at: str
    accepted_at: Optional[str] = None
    completed_at: Optional[str] = None

class MessageCreate(BaseModel):
    demand_id: str
    content: str

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    demand_id: str
    sender_id: str
    sender_name: str
    sender_role: str
    content: str
    created_at: str

class ReviewCreate(BaseModel):
    demand_id: str
    rating: int  # 1-5
    comment: str
    images: List[str] = []

class ReviewResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    demand_id: str
    reviewer_id: str
    reviewer_name: str
    reviewed_user_id: str
    rating: int
    comment: str
    images: List[str] = []
    created_at: str

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

# ============ CATEGORIES ============

CATEGORIES = [
    "Autoservis",
    "Bezpečnostní služby, zabezpečení objektů",
    "Čalounictví",
    "Dluhové poradenství, vymáhání pohledávek",
    "Finanční poradenství",
    "Fotografické služby",
    "Geodetické služby",
    "Hlídání dětí a zvířat",
    "Hodinový manžel",
    "Instalatérství",
    "IT služby, Webdesign",
    "Izolatérství",
    "Jeřábnické práce, autodoprava",
    "Klimatizace, vzduchotechnika",
    "Kominictví",
    "Kosmetické služby",
    "Krejčovství",
    "Lesnictví, myslivectví",
    "Malířství, natěračství",
    "Masérské služby",
    "Měření a regulace",
    "Montáže oken/dveří",
    "Pečovatelské služby",
    "Pískování materiálů",
    "Plynaři, topenáři",
    "Podlaháři",
    "Pojišťovnictví",
    "Požárně bezpečnostní služby",
    "Právnické služby",
    "Projektování staveb",
    "Pronájem reklamních ploch",
    "Překlady, tlumočení",
    "Půjčky, hypotéky",
    "Půjčovny",
    "Realitní služby",
    "Reklamní služby",
    "Revize",
    "Sádrokartonářské práce",
    "Sanace zdiva",
    "Servis elektrospotřebičů",
    "Elektromontáže - silnoproud",
    "Sklenáři",
    "Elektromontáže - slaboproud",
    "Služby pro zvířata",
    "Stavební práce, rekonstrukce",
    "Stěhování, doprava",
    "Strojní a ruční výkopové práce",
    "Tesaři, pokrývači",
    "Truhláři, stolaři, výroba nábytku",
    "Účetnictví, správa firem",
    "Údržba zeleně",
    "Úklidové služby",
    "Veřejné osvětlení",
    "Výroba z kovu",
    "Výškové práce",
    "Výuka",
    "Zahradní architektura",
    "Zámečnictví, svářeči",
    "Zednictví, obkladačství, dlaždičství",
    "Zemnění, hromosvody",
    "Ostatní"
]

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        phone=user["phone"],
        role=user["role"],
        supplier_type=user.get("supplier_type"),
        company_name=user.get("company_name"),
        ico=user.get("ico"),
        address=user.get("address"),
        categories=user.get("categories", []),
        is_verified=user.get("is_verified", False),
        trial_ends_at=user.get("trial_ends_at"),
        subscription_active=user.get("subscription_active", False),
        created_at=user.get("created_at", datetime.now(timezone.utc).isoformat()),
        rating=user.get("rating", 0.0),
        reviews_count=user.get("reviews_count", 0),
        location=user.get("location")
    )

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=14)
    
    user = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "phone": user_data.phone,
        "role": user_data.role,
        "supplier_type": user_data.supplier_type,
        "company_name": user_data.company_name,
        "ico": user_data.ico,
        "dic": user_data.dic,
        "address": user_data.address,
        "branch_address": user_data.branch_address,
        "profile_image": user_data.profile_image,
        "categories": user_data.categories or [],
        "is_verified": False,
        "trial_ends_at": trial_end.isoformat(),
        "subscription_active": True,  # Active during trial
        "created_at": now.isoformat(),
        "rating": 0.0,
        "reviews_count": 0,
        "location": None
    }
    
    await db.users.insert_one(user)
    
    token = create_token(user_id, user_data.email, user_data.role)
    
    return TokenResponse(
        access_token=token,
        user=user_to_response(user)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return TokenResponse(
        access_token=token,
        user=user_to_response(user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_to_response(current_user)

# ============ USER ROUTES ============

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_response(user)

@api_router.put("/users/profile")
async def update_profile(
    company_name: Optional[str] = None,
    address: Optional[str] = None,
    phone: Optional[str] = None,
    categories: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    if company_name is not None:
        update_data["company_name"] = company_name
    if address is not None:
        update_data["address"] = address
    if phone is not None:
        update_data["phone"] = phone
    if categories is not None:
        update_data["categories"] = categories
    
    if update_data:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    return {"message": "Profile updated"}

@api_router.post("/users/location")
async def update_location(
    location: LocationUpdate,
    current_user: dict = Depends(get_current_user)
):
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"location": {"lat": location.latitude, "lng": location.longitude, "updated_at": datetime.now(timezone.utc).isoformat()}}}
    )
    return {"message": "Location updated"}

# ============ CATEGORIES ROUTES ============

@api_router.get("/categories")
async def get_categories():
    return {"categories": CATEGORIES}

# ============ GEOCODING ROUTES ============

@api_router.get("/geocode/search")
async def geocode_search(q: str):
    """Search for addresses using OpenStreetMap Nominatim"""
    async with httpx.AsyncClient() as client_http:
        response = await client_http.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": q,
                "format": "json",
                "addressdetails": 1,
                "limit": 5,
                "countrycodes": "cz",
                "accept-language": "cs"
            },
            headers={"User-Agent": "CraftBolt/1.0"}
        )
        return response.json()

@api_router.get("/geocode/reverse")
async def geocode_reverse(lat: float, lon: float):
    """Reverse geocode coordinates to address using Nominatim"""
    async with httpx.AsyncClient() as client_http:
        response = await client_http.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={
                "lat": lat,
                "lon": lon,
                "format": "json",
                "addressdetails": 1,
                "accept-language": "cs"
            },
            headers={"User-Agent": "CraftBolt/1.0"}
        )
        return response.json()

# ============ ARES ROUTES ============

@api_router.get("/ares/{ico}")
async def ares_lookup(ico: str):
    """Lookup company info from Czech ARES registry by ICO"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client_http:
            response = await client_http.get(
                f"https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}"
            )
            if response.status_code != 200:
                raise HTTPException(status_code=404, detail="IČO nenalezeno v registru ARES")
            data = response.json()
            
            result = {
                "company_name": data.get("obchodniJmeno", ""),
                "ico": data.get("ico", ico),
                "dic": "",
                "address": ""
            }
            
            # Extract DIC
            dic_list = data.get("dic", []) if isinstance(data.get("dic"), list) else []
            if dic_list:
                result["dic"] = dic_list[0] if dic_list else ""
            elif isinstance(data.get("dic"), str):
                result["dic"] = data.get("dic", "")
            
            # Extract address
            sidlo = data.get("sidlo", {})
            if sidlo:
                parts = []
                if sidlo.get("nazevUlice"):
                    street = sidlo["nazevUlice"]
                    if sidlo.get("cisloDomovni"):
                        street += f" {sidlo['cisloDomovni']}"
                    if sidlo.get("cisloOrientacni"):
                        street += f"/{sidlo['cisloOrientacni']}"
                    parts.append(street)
                if sidlo.get("psc"):
                    parts.append(str(sidlo["psc"]))
                if sidlo.get("nazevObce"):
                    parts.append(sidlo["nazevObce"])
                result["address"] = ", ".join(parts)
            
            return result
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="ARES služba není dostupná")

# ============ UPLOAD ROUTES ============

@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Nepodporovaný formát. Povolené: JPEG, PNG, WebP, GIF")
    
    max_size = 10 * 1024 * 1024  # 10MB
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="Soubor je příliš velký. Max 10 MB.")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(contents)
    
    return {"url": f"/api/uploads/{filename}", "filename": filename}

# ============ DEMANDS ROUTES ============

@api_router.post("/demands", response_model=DemandResponse)
async def create_demand(
    demand_data: DemandCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.CUSTOMER and current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only customers can create demands")
    
    demand_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    demand = {
        "id": demand_id,
        "title": demand_data.title,
        "description": demand_data.description,
        "category": demand_data.category,
        "address": demand_data.address,
        "latitude": demand_data.latitude,
        "longitude": demand_data.longitude,
        "images": demand_data.images,
        "budget_min": demand_data.budget_min,
        "budget_max": demand_data.budget_max,
        "payment_method": demand_data.payment_method,
        "status": "open",
        "customer_id": current_user["id"],
        "customer_name": current_user.get("company_name") or current_user["email"],
        "assigned_supplier_id": None,
        "assigned_supplier_name": None,
        "created_at": now.isoformat(),
        "accepted_at": None,
        "completed_at": None
    }
    
    await db.demands.insert_one(demand)
    
    return DemandResponse(**demand)

@api_router.get("/demands", response_model=List[DemandResponse])
async def get_demands(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == UserRole.CUSTOMER:
        query["customer_id"] = current_user["id"]
    elif current_user["role"] == UserRole.SUPPLIER:
        # Suppliers see open demands or their assigned ones
        if status:
            if status == "open":
                query["status"] = "open"
            else:
                query["$or"] = [
                    {"status": status, "assigned_supplier_id": current_user["id"]},
                    {"status": "open"}
                ]
        else:
            query["$or"] = [
                {"assigned_supplier_id": current_user["id"]},
                {"status": "open"}
            ]
    
    if category:
        query["category"] = category
    
    demands = await db.demands.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [DemandResponse(**d) for d in demands]

@api_router.get("/demands/available", response_model=List[DemandResponse])
async def get_available_demands(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != UserRole.SUPPLIER:
        raise HTTPException(status_code=403, detail="Only suppliers can view available demands")
    
    query = {"status": "open"}
    
    # Filter by supplier's categories if they have any
    supplier_categories = current_user.get("categories", [])
    if supplier_categories:
        query["category"] = {"$in": supplier_categories}
    
    if category:
        query["category"] = category
    
    demands = await db.demands.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [DemandResponse(**d) for d in demands]

@api_router.get("/demands/my", response_model=List[DemandResponse])
async def get_my_demands(current_user: dict = Depends(get_current_user)):
    query = {}
    
    if current_user["role"] == UserRole.CUSTOMER:
        query["customer_id"] = current_user["id"]
    elif current_user["role"] == UserRole.SUPPLIER:
        query["assigned_supplier_id"] = current_user["id"]
    
    demands = await db.demands.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [DemandResponse(**d) for d in demands]

@api_router.get("/demands/{demand_id}", response_model=DemandResponse)
async def get_demand(demand_id: str, current_user: dict = Depends(get_current_user)):
    demand = await db.demands.find_one({"id": demand_id}, {"_id": 0})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    return DemandResponse(**demand)

@api_router.post("/demands/{demand_id}/accept")
async def accept_demand(demand_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.SUPPLIER:
        raise HTTPException(status_code=403, detail="Only suppliers can accept demands")
    
    demand = await db.demands.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    if demand["status"] != "open":
        raise HTTPException(status_code=400, detail="Demand is not available")
    
    now = datetime.now(timezone.utc)
    await db.demands.update_one(
        {"id": demand_id},
        {"$set": {
            "status": "in_progress",
            "assigned_supplier_id": current_user["id"],
            "assigned_supplier_name": current_user.get("company_name") or current_user["email"],
            "accepted_at": now.isoformat()
        }}
    )
    
    return {"message": "Demand accepted"}

@api_router.post("/demands/{demand_id}/complete")
async def complete_demand(demand_id: str, current_user: dict = Depends(get_current_user)):
    demand = await db.demands.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    # Both customer and assigned supplier can complete
    if current_user["id"] != demand["customer_id"] and current_user["id"] != demand.get("assigned_supplier_id"):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    now = datetime.now(timezone.utc)
    await db.demands.update_one(
        {"id": demand_id},
        {"$set": {"status": "completed", "completed_at": now.isoformat()}}
    )
    
    return {"message": "Demand completed"}

@api_router.post("/demands/{demand_id}/cancel")
async def cancel_demand(demand_id: str, current_user: dict = Depends(get_current_user)):
    demand = await db.demands.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    if current_user["id"] != demand["customer_id"] and current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.demands.update_one(
        {"id": demand_id},
        {"$set": {"status": "cancelled"}}
    )
    
    return {"message": "Demand cancelled"}

# ============ MESSAGES ROUTES ============

@api_router.post("/messages", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    demand = await db.demands.find_one({"id": message_data.demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    # Only customer and assigned supplier can chat
    if current_user["id"] != demand["customer_id"] and current_user["id"] != demand.get("assigned_supplier_id"):
        # Allow if demand is open and user is supplier
        if demand["status"] != "open" or current_user["role"] != UserRole.SUPPLIER:
            raise HTTPException(status_code=403, detail="Not authorized to send messages")
    
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    message = {
        "id": message_id,
        "demand_id": message_data.demand_id,
        "sender_id": current_user["id"],
        "sender_name": current_user.get("company_name") or current_user["email"],
        "sender_role": current_user["role"],
        "content": message_data.content,
        "created_at": now.isoformat()
    }
    
    await db.messages.insert_one(message)
    
    return MessageResponse(**message)

@api_router.get("/messages/{demand_id}", response_model=List[MessageResponse])
async def get_messages(demand_id: str, current_user: dict = Depends(get_current_user)):
    demand = await db.demands.find_one({"id": demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    messages = await db.messages.find({"demand_id": demand_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [MessageResponse(**m) for m in messages]

# ============ REVIEWS ROUTES ============

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    demand = await db.demands.find_one({"id": review_data.demand_id})
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    if demand["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed demands")
    
    # Determine who is being reviewed
    if current_user["id"] == demand["customer_id"]:
        reviewed_user_id = demand["assigned_supplier_id"]
    elif current_user["id"] == demand["assigned_supplier_id"]:
        reviewed_user_id = demand["customer_id"]
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if already reviewed
    existing = await db.reviews.find_one({
        "demand_id": review_data.demand_id,
        "reviewer_id": current_user["id"]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed")
    
    review_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    review = {
        "id": review_id,
        "demand_id": review_data.demand_id,
        "reviewer_id": current_user["id"],
        "reviewer_name": current_user.get("company_name") or current_user["email"],
        "reviewed_user_id": reviewed_user_id,
        "rating": review_data.rating,
        "comment": review_data.comment,
        "images": review_data.images,
        "created_at": now.isoformat()
    }
    
    await db.reviews.insert_one(review)
    
    # Update user rating
    reviews = await db.reviews.find({"reviewed_user_id": reviewed_user_id}, {"_id": 0}).to_list(1000)
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
        await db.users.update_one(
            {"id": reviewed_user_id},
            {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
        )
    
    return ReviewResponse(**review)

@api_router.get("/reviews/user/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(user_id: str):
    reviews = await db.reviews.find({"reviewed_user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ReviewResponse(**r) for r in reviews]

# ============ ADMIN ROUTES ============

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    total_users = await db.users.count_documents({})
    customers = await db.users.count_documents({"role": UserRole.CUSTOMER})
    suppliers = await db.users.count_documents({"role": UserRole.SUPPLIER})
    total_demands = await db.demands.count_documents({})
    open_demands = await db.demands.count_documents({"status": "open"})
    completed_demands = await db.demands.count_documents({"status": "completed"})
    
    return {
        "total_users": total_users,
        "customers": customers,
        "suppliers": suppliers,
        "total_demands": total_demands,
        "open_demands": open_demands,
        "completed_demands": completed_demands
    }

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [user_to_response(u) for u in users]

@api_router.get("/admin/demands", response_model=List[DemandResponse])
async def get_all_demands(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    
    demands = await db.demands.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [DemandResponse(**d) for d in demands]

# ============ SUPPLIERS PUBLIC ROUTES ============

@api_router.get("/suppliers", response_model=List[UserResponse])
async def get_suppliers(category: Optional[str] = None):
    query = {"role": UserRole.SUPPLIER, "is_verified": True}
    if category:
        query["categories"] = category
    
    suppliers = await db.users.find(query, {"_id": 0, "password": 0}).sort("rating", -1).to_list(100)
    return [user_to_response(s) for s in suppliers]

# ============ ROOT ROUTE ============

@api_router.get("/")
async def root():
    return {"message": "CraftBolt API v1.0", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

# Serve uploaded files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    await db.demands.create_index("customer_id")
    await db.demands.create_index("assigned_supplier_id")
    await db.demands.create_index("status")
    await db.demands.create_index("category")
    await db.messages.create_index("demand_id")
    await db.reviews.create_index("reviewed_user_id")
    
    # Create admin user if not exists
    admin = await db.users.find_one({"email": "admin@craftbolt.cz"})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@craftbolt.cz",
            "password": hash_password("CraftBolt2026!"),
            "phone": "+420000000000",
            "role": UserRole.ADMIN,
            "supplier_type": None,
            "company_name": "CraftBolt Admin",
            "ico": None,
            "address": None,
            "categories": [],
            "is_verified": True,
            "trial_ends_at": None,
            "subscription_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "rating": 0.0,
            "reviews_count": 0,
            "location": None
        }
        await db.users.insert_one(admin_user)
        logger.info("Admin user created: admin@craftbolt.cz")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
