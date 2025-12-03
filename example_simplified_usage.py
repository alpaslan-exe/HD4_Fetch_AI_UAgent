#!/usr/bin/env python3
"""
Example usage of the simplified backend for course and professor data
"""
import asyncio
import json
from simplified_backend import generate_schedule, CourseRequest

async def example_usage():
    # Example: Generate a schedule with multiple courses
    courses = [
        CourseRequest(
            school_name="University of Michigan - Dearborn",
            department="Computer Science",
            course_number="CIS375",  # Course number
            semester_code="f25",  # Fall 2025
            course_name="Introduction to Software Engineering",
            dept_code="CIS"  # Optional department code override
        ),
        CourseRequest(
            school_name="University of Michigan - Dearborn", 
            department="Computer Science",
            course_number="CIS450",  # Course number
            semester_code="f25",  # Fall 2025
            course_name="Advanced Database Systems",
            dept_code="CIS"  # Optional department code override
        )
    ]
    
    # Generate the schedule
    result = await generate_schedule(courses)
    
    # Print the result
    print("Generated Schedule:")
    print(json.dumps(result.dict(), indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(example_usage())