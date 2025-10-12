"""
Example usage of the AI Agent Backend
"""
import requests
import json

# Base URL for the backend API
BASE_URL = "http://localhost:8000"

def example_usage():
    # Example 1: User Signup
    print("=== User Signup ===")
    signup_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword123"
    }
    
    response = requests.post(f"{BASE_URL}/signup", json=signup_data)
    if response.status_code == 201:
        user_data = response.json()
        print(f"User created successfully: {user_data}")
        user_id = user_data['id']
    else:
        print(f"Signup failed: {response.status_code} - {response.text}")
        return
    
    # Example 2: User Login
    print("\n=== User Login ===")
    login_data = {
        "username": "testuser",
        "password": "securepassword123"
    }
    
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data['access_token']
        print(f"Login successful. Token: {access_token[:20]}...")
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        return
    
    # Example 3: Access protected endpoint
    print("\n=== Access Protected Endpoint ===")
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    if response.status_code == 200:
        user_info = response.json()
        print(f"User info retrieved: {user_info}")
    else:
        print(f"Failed to retrieve user info: {response.status_code} - {response.text}")
    
    # Example 4: Health check
    print("\n=== Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        health_data = response.json()
        print(f"Health check: {health_data}")
    else:
        print(f"Health check failed: {response.status_code} - {response.text}")

if __name__ == "__main__":
    example_usage()