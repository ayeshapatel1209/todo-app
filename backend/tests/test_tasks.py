import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Change these lines at the top:
from app.database import Base, get_db
from app.main import app

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

@pytest.fixture
def auth_token():
    """Create a user and return auth token"""
    # Register user
    client.post(
        "/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    # Login and get token
    response = client.post(
        "/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    return response.json()["access_token"]

@pytest.fixture
def auth_headers(auth_token):
    """Return authorization headers"""
    return {"Authorization": f"Bearer {auth_token}"}

class TestTaskCreation:
    """Tests for creating tasks"""
    
    def test_create_task_success(self, auth_headers):
        """Test successful task creation"""
        response = client.post(
            "/tasks",
            json={"title": "Test Task", "description": "Test Description"},
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] == "Test Description"
        assert data["completed"] is False
        assert "id" in data
    
    def test_create_task_without_description(self, auth_headers):
        """Test creating task without description"""
        response = client.post(
            "/tasks",
            json={"title": "Test Task"},
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Task"
        assert data["description"] is None
    
    def test_create_task_unauthorized(self):
        """Test creating task without authentication"""
        response = client.post(
            "/tasks",
            json={"title": "Test Task", "description": "Test Description"}
        )
        assert response.status_code == 401
    
    def test_create_task_invalid_token(self):
        """Test creating task with invalid token"""
        response = client.post(
            "/tasks",
            json={"title": "Test Task", "description": "Test Description"},
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
    
    def test_create_task_missing_title(self, auth_headers):
        """Test creating task without title"""
        response = client.post(
            "/tasks",
            json={"description": "Test Description"},
            headers=auth_headers
        )
        assert response.status_code == 422

class TestTaskRetrieval:
    """Tests for retrieving tasks"""
    
    def test_get_tasks_empty(self, auth_headers):
        """Test getting tasks when none exist"""
        response = client.get("/tasks", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_tasks_list(self, auth_headers):
        """Test getting list of tasks"""
        # Create tasks
        client.post(
            "/tasks",
            json={"title": "Task 1", "description": "Description 1"},
            headers=auth_headers
        )
        client.post(
            "/tasks",
            json={"title": "Task 2", "description": "Description 2"},
            headers=auth_headers
        )
        
        # Get tasks
        response = client.get("/tasks", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["title"] == "Task 1"
        assert data[1]["title"] == "Task 2"
    
    def test_get_tasks_unauthorized(self):
        """Test getting tasks without authentication"""
        response = client.get("/tasks")
        assert response.status_code == 401
    
    def test_get_specific_task(self, auth_headers):
        """Test getting a specific task by ID"""
        # Create task
        create_response = client.post(
            "/tasks",
            json={"title": "Test Task", "description": "Test Description"},
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Get specific task
        response = client.get(f"/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task_id
        assert data["title"] == "Test Task"
    
    def test_get_nonexistent_task(self, auth_headers):
        """Test getting a task that doesn't exist"""
        response = client.get("/tasks/99999", headers=auth_headers)
        assert response.status_code == 404

class TestTaskUpdate:
    """Tests for updating tasks"""
    
    def test_update_task_title(self, auth_headers):
        """Test updating task title"""
        # Create task
        create_response = client.post(
            "/tasks",
            json={"title": "Original Title", "description": "Description"},
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Update task
        response = client.put(
            f"/tasks/{task_id}",
            json={"title": "Updated Title"},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == "Description"
    
    def test_update_task_completion(self, auth_headers):
        """Test marking task as completed"""
        # Create task
        create_response = client.post(
            "/tasks",
            json={"title": "Test Task", "description": "Description"},
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Mark as completed
        response = client.put(
            f"/tasks/{task_id}",
            json={"completed": True},
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["completed"] is True
    
    def test_update_nonexistent_task(self, auth_headers):
        """Test updating a task that doesn't exist"""
        response = client.put(
            "/tasks/99999",
            json={"title": "Updated Title"},
            headers=auth_headers
        )
        assert response.status_code == 404

class TestTaskDeletion:
    """Tests for deleting tasks"""
    
    def test_delete_task_success(self, auth_headers):
        """Test successful task deletion"""
        # Create task
        create_response = client.post(
            "/tasks",
            json={"title": "Test Task", "description": "Description"},
            headers=auth_headers
        )
        task_id = create_response.json()["id"]
        
        # Delete task
        response = client.delete(f"/tasks/{task_id}", headers=auth_headers)
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()
        
        # Verify deletion
        get_response = client.get(f"/tasks/{task_id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_delete_nonexistent_task(self, auth_headers):
        """Test deleting a task that doesn't exist"""
        response = client.delete("/tasks/99999", headers=auth_headers)
        assert response.status_code == 404

class TestTaskIsolation:
    """Tests for ensuring users can only access their own tasks"""
    
    def test_users_cannot_see_other_tasks(self):
        """Test that users can only see their own tasks"""
        # Create user 1
        client.post(
            "/register",
            json={"email": "user1@example.com", "password": "password123"}
        )
        token1_response = client.post(
            "/login",
            json={"email": "user1@example.com", "password": "password123"}
        )
        token1 = token1_response.json()["access_token"]
        headers1 = {"Authorization": f"Bearer {token1}"}
        
        # Create user 2
        client.post(
            "/register",
            json={"email": "user2@example.com", "password": "password123"}
        )
        token2_response = client.post(
            "/login",
            json={"email": "user2@example.com", "password": "password123"}
        )
        token2 = token2_response.json()["access_token"]
        headers2 = {"Authorization": f"Bearer {token2}"}
        
        # User 1 creates task
        client.post(
            "/tasks",
            json={"title": "User 1 Task"},
            headers=headers1
        )
        
        # User 2 creates task
        client.post(
            "/tasks",
            json={"title": "User 2 Task"},
            headers=headers2
        )
        
        # User 1 should only see their task
        response1 = client.get("/tasks", headers=headers1)
        tasks1 = response1.json()
        assert len(tasks1) == 1
        assert tasks1[0]["title"] == "User 1 Task"
        
        # User 2 should only see their task
        response2 = client.get("/tasks", headers=headers2)
        tasks2 = response2.json()
        assert len(tasks2) == 1
        assert tasks2[0]["title"] == "User 2 Task"