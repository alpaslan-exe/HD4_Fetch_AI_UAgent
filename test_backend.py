"""
Basic test for the backend without database
"""
from fastapi.testclient import TestClient
from backend import app

def test_health_endpoint():
    """Test the health endpoint which doesn't require database"""
    client = TestClient(app)
    
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    print("✅ Health endpoint test passed")

def test_unauthorized_access():
    """Test that protected endpoints return 401 without auth"""
    client = TestClient(app)
    
    response = client.get("/users/me")
    # Should return 401 or 403 since no auth token provided
    assert response.status_code in [401, 403]
    print("✅ Unauthorized access test passed")

if __name__ == "__main__":
    test_health_endpoint()
    test_unauthorized_access()
    print("🎉 All basic tests passed!")