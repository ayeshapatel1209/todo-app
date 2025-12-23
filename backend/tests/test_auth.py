import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Change these lines at the top:
from app.database import Base, get_db
from app.main import app
from app import models  # Only in test_auth.py

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop after"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

class TestUserSignup:
    """Tests for user registration"""
    
    def test_signup_success(self):
        """Test successful user registration"""
        response = client.post(
            "/register",
            json={"email": "test@example.com", "password": "password123"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "id" in data
        assert "hashed_password" not in data
    
    def test_signup_duplicate_email(self):
        """Test registration with existing email"""
        # First registration
        client.post(
            "/register",
            json={"email": "test@example.com", "password": "password123"}
        )
        # Attempt duplicate registration
        response = client.post(
            "/register",
            json={"email": "test@example.com", "password": "password456"}
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_signup_invalid_email(self):
        """Test registration with invalid email"""
        response = client.post(
            "/register",
            json={"email": "invalid-email", "password": "password123"}
        )
        assert response.status_code == 422
    
    def test_signup_short_password(self):
        """Test registration with short password"""
        response = client.post(
            "/register",
            json={"email": "test@example.com", "password": "short"}
        )
        assert response.status_code == 422
    
    def test_signup_missing_fields(self):
        """Test registration with missing fields"""
        response = client.post(
            "/register",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422

class TestUserLogin:
    """Tests for user login"""
    
    def test_login_success(self):
        """Test successful login"""
        # Register user first
        client.post(
            "/register",
            json={"email": "test@example.com", "password": "password123"}
        )
        # Login
        response = client.post(
            "/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self):
        """Test login with incorrect password"""
        # Register user first
        client.post(
            "/register",
            json={"email": "test@example.com", "password": "password123"}
        )
        # Login with wrong password
        response = client.post(
            "/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent user"""
        response = client.post(
            "/login",
            json={"email": "nonexistent@example.com", "password": "password123"}
        )
        assert response.status_code == 401
    
    def test_login_missing_fields(self):
        """Test login with missing fields"""
        response = client.post(
            "/login",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422

class TestPasswordHashing:
    """Tests for password security"""
    
    def test_password_not_stored_plaintext(self):
        """Verify password is hashed, not stored in plaintext"""
        password = "password123"
        client.post(
            "/register",
            json={"email": "test@example.com", "password": password}
        )
        
        # Check database directly
        db = TestingSessionLocal()
        user = db.query(models.User).filter(models.User.email == "test@example.com").first()
        assert user.hashed_password != password
        assert len(user.hashed_password) > 50  # Bcrypt hashes are long
        db.close()