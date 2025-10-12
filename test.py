from typing import List

# Department mapping
def mapCourseDepartment(courseCodesList: List[str]) -> tuple:

    departments = ['Computer Science', 'Engineering', 'Mathematics',
                   'English', 'Economics', 'Statistics', 'Chemistry',
                   'Biology', 'Science', 'Physics', 'Geology',
                   'Health & Human Services']

    courses = courseCodesList['courses']

    fullDepartmentNames = []
    courseAcronyms = []
    courseNumbers = []

    for course in courses:
        courseSplit = course.split(' ')

        acronym = courseSplit[0]

        match acronym:
            case 'CIS' | 'CCM':
                fullName = departments[0] + ' department'
            case 'ECE' | 'ENGR':
                fullName = departments[1] + ' department'
            case 'MATH':
                fullName = departments[2] + ' department'
            case 'COMP':
                fullName = departments[3] + ' department'
            case 'ECON':
                fullName = departments[4] + ' department'
            case 'STAT':
                fullName = departments[5] + ' department'
            case 'CHEM':
                fullName = departments[6] + ' department'
            case 'BIOL':
                fullName = departments[7] + ' department'
            case 'ASTR':
                fullName = departments[8] + ' department'
            case 'PHYS':
                fullName = departments[9] + ' department'
            case 'GEOL':
                fullName = departments[10] + ' department'
            case 'HHS':
                fullName = departments[11] + ' department'
            case _:
                fullName = 'Unknown department'

        fullDepartmentNames.append(fullName)
        courseAcronyms.append(acronym)
        courseNumbers.append(courseSplit[1])

    return fullDepartmentNames, courseAcronyms, courseNumbers

if __name__ == '__main__':

     data = {"courses":["ASTR 130","BIOL 130","BIOL 320","CCM 404","CCM 472","CCM 473","CHEM 134","CHEM 136","CIS 150","CIS 200","CIS 275","CIS 296","CIS 297","CIS 298","CIS 310","CIS 350","CIS 375","CIS 376","CIS 405","CIS 411","CIS 412","CIS 422","CIS 427","CIS 439","CIS 446","CIS 449","CIS 450","CIS 451","CIS 452","CIS 481","CIS 482","CIS 483","CIS 489","CIS 1501","CIS 2001","CIS 3200","CIS 4851","CIS 4981","CIS 4982","COMP 105","COMP 270","ECE 3100","ECON 201","ECON 202","GEOL 118","GEOL 218","HHS 470","IMSE 317","MATH 115","MATH 116","MATH 215","PHYS 125","PHYS 125L","PHYS 126","PHYS 150","PHYS 150L","PHYS 151","PHYS 151L","STAT 305","STAT 430"],"count":60}

     fullDepartmentNames, departmentAcronyms, courseNumbers = mapCourseDepartment(courseCodesList=data)

     print(fullDepartmentNames)
     print(departmentAcronyms)
     print(courseNumbers)