#!/usr/bin/env python3
"""
Test script to verify the simplified backend functionality with real data
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
            "course_number": "CIS350", 
            "semester_code": "f25",  # Fall 2025
            "course_name": "Software Engineering I",
            "dept_code": "CIS"
        }
    ]
    
    try:
        response = requests.post(url, json=test_data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("API Test successful!")
            print("Response structure:")
            print(json.dumps(result, indent=2))
            
            # Check the structure
            schedule = result.get("schedule", {})
            print(f"\nSemesters in schedule: {list(schedule.keys())}")
            
            for semester_code, courses in schedule.items():
                print(f"\nSemester: {semester_code}")
                for course in courses:
                    print(f"  Course: {course['course_name']}")
                    print(f"  Grade: {course['grade']}")
                    professors = course['professors']
                    print(f"  Number of professors: {len(professors)}")
                    
                    # Show first few professors for verification
                    for i, prof in enumerate(professors[:3]):  # Show top 3
                        print(f"    {i+1}. {prof['name']}")
                        print(f"       Rating: {prof['avgRating']}")
                        print(f"       Difficulty: {prof['avgDifficulty']}")
                        print(f"       Would Take Again: {prof['wouldTakeAgainPercent']}")
                        print(f"       Reviews: {len(prof['latestComments'])} comments")
                        print(f"       Tags: {len(prof['teacherTags'])} tags")
        else:
            print(f"API Test failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    test_api()