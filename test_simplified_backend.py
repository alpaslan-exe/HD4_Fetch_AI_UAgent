#!/usr/bin/env python3
"""
Test script to verify the simplified backend functionality
"""
import requests
import json

def test_api():
    # Test the API endpoint
    url = "http://localhost:8000/generate-schedule"
    
    # Sample data to test with
    test_data = [
        {
            "school_name": "University of Michigan - Dearborn",
            "department": "Computer Science",
            "course_number": "CIS375", 
            "semester_code": "f25",  # Fall 2025
            "course_name": "Software Engineering",
            "dept_code": "CIS"
        }
    ]
    
    try:
        response = requests.post(url, json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print("API Test successful!")
            print(json.dumps(result, indent=2))
        else:
            print(f"API Test failed with status code: {response.status_code}")
            
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    test_api()