#!/usr/bin/env python3
"""
Script to create a user for the HD4 Scheduler application.
This is useful for getting started quickly.
"""

import requests
import sys
import json

def create_user(username, email, password):
    """Create a new user via the API"""
    url = "http://localhost:8000/api/auth/signup"
    
    payload = {
        "username": username,
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(url, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print("\n✅ User created successfully!")
            print(f"\n📧 Email: {email}")
            print(f"👤 Username: {username}")
            print(f"🔑 Password: {password}")
            print("\nYou can now login at http://localhost:5173")
            return True
        else:
            error_data = response.json()
            print(f"\n❌ Error creating user: {error_data.get('detail', 'Unknown error')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to backend.")
        print("Make sure the backend is running on http://localhost:8000")
        print("\nStart it with: python backend.py")
        return False
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

def main():
    print("=" * 50)
    print("  HD4 Scheduler - User Creation")
    print("=" * 50)
    print()
    
    # Get user input
    if len(sys.argv) == 4:
        username = sys.argv[1]
        email = sys.argv[2]
        password = sys.argv[3]
    else:
        print("Create a new user account\n")
        username = input("Enter username: ").strip()
        email = input("Enter email: ").strip()
        password = input("Enter password: ").strip()
    
    if not username or not email or not password:
        print("\n❌ All fields are required!")
        sys.exit(1)
    
    print("\n📝 Creating user...")
    success = create_user(username, email, password)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()

