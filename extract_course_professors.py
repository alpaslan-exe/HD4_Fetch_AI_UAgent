#!/usr/bin/env python3
"""
extract_course_professors.py

Usage:
  python extract_course_professors.py "School name" "Department substring" "CourseNumber" [DeptCodeOptional]

Example:
  python extract_course_professors.py "University of Michigan - Dearborn" "Computer Science" CIS375 CS

Output:
  JSON array printed to stdout. Each item contains only:
    - id
    - name
    - avgRating
    - avgDifficulty
    - wouldTakeAgainPercent
    - teacherTags (array of tagName strings)
    - latestComments (array of up to 3 most recent rating comments)
"""

import sys, json, time, re, requests

GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "rmp-extractor/1.0",
    "Referer": "https://www.ratemyprofessors.com/",
    "Origin": "https://www.ratemyprofessors.com"
}

# --- Introspection helpers ----------------------------------------------------
INTROSPECT_TYPE_Q = """
query IntrospectType($typeName: String!) {
  __type(name: $typeName) {
    name
    kind
    fields {
      name
      type {
        kind
        name
        ofType { kind name ofType { kind name } }
      }
    }
  }
}
"""

def gql(query, variables=None, timeout=20):
    payload = {"query": query, "variables": variables or {}}
    r = requests.post(GRAPHQL_URL, json=payload, headers=HEADERS, timeout=30)
    r.raise_for_status()
    return r.json()

def introspect_type(name):
    res = gql(INTROSPECT_TYPE_Q, {"typeName": name})
    return res.get("data", {}).get("__type")

def pick_rating_field_candidates():
    """
    Inspect Rating type and pick plausible field names for:
      - comment field (likely 'comment')
      - class/course field (one of ['class','course','courseType','className'])
      - ratingTags (likely 'ratingTags')
    Returns dict with keys: comment, class_fields(list), ratingTags
    """
    rt = introspect_type("Rating")
    if not rt:
        # fallback guesses
        return {"comment": "comment", "class_fields": ["class", "course", "courseType", "className"], "ratingTags": "ratingTags"}
    field_names = [f["name"] for f in rt.get("fields", [])]
    comment = "comment" if "comment" in field_names else (field_names[0] if field_names else "comment")
    # collect possible class-like names in preferred order
    possible = []
    for cand in ("class", "course", "courseType", "className"):
        if cand in field_names:
            possible.append(cand)
    # ratingTags / tag field
    rtags = "ratingTags" if "ratingTags" in field_names else ( "tags" if "tags" in field_names else None )
    if not possible:
        possible = ["class", "course", "courseType", "className"]
    return {"comment": comment, "class_fields": possible, "ratingTags": rtags}

def find_teacher_tag_info():
    """
    Introspect Teacher type to discover a teacher-level tag field and its scalar subfield name for tag label.
    Returns (teacher_tag_field_name, tag_name_field) or (None,None) if not present.
    """
    teacher = introspect_type("Teacher")
    if not teacher:
        return (None, None)
    fields = {f["name"]: f for f in teacher.get("fields", [])}
    # candidate field names that hold aggregated tags:
    candidates = ["teacherRatingTags", "teacherTags", "topTags", "tags", "tagStats"]
    chosen_field = None
    for c in candidates:
        if c in fields:
            chosen_field = c
            break
    if not chosen_field:
        # try fuzzy search
        for fname in fields:
            if "tag" in fname.lower():
                chosen_field = fname
                break
    if not chosen_field:
        return (None, None)
    # unwrap type name of that field to find the concrete tag type
    t = fields[chosen_field].get("type") or {}
    def unwrap_type(tnode):
        if not tnode: return None
        if tnode.get("name"):
            return tnode.get("name")
        ot = tnode.get("ofType")
        return unwrap_type(ot)
    tag_typename = unwrap_type(t)
    if not tag_typename:
        return (chosen_field, None)
    # introspect the tag type
    tag_info = introspect_type(tag_typename)
    tag_fields = [f["name"] for f in (tag_info.get("fields") or [])] if tag_info else []
    # prefer 'tagName' or 'name'
    tagname_field = None
    for cand in ("tagName", "name", "label"):
        if cand in tag_fields:
            tagname_field = cand
            break
    # fallback to first scalar-like field (non-object) - but we only have names here; choose 'tagName' last resort
    if not tagname_field:
        tagname_field = "tagName" if "tagName" in tag_fields else (tag_fields[0] if tag_fields else None)
    return (chosen_field, tagname_field)

# --- School & teacher search helpers ------------------------------------------
SCHOOL_SEARCH_Q = """
query SearchSchools($q: String!) {
  newSearch {
    schools(query: { text: $q }) { edges { node { id name city state } } }
  }
}
"""

TEACHERS_PAGED_Q = """
query SearchTeachers($text: String!, $schoolID: ID!, $first: Int!, $after: String) {
  newSearch {
    teachers(query: { text: $text, schoolID: $schoolID }, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { id firstName lastName department numRatings } }
    }
  }
}
"""

def search_school(name):
    res = gql(SCHOOL_SEARCH_Q, {"q": name})
    nodes = res.get("data",{}).get("newSearch",{}).get("schools",{}).get("edges") or []
    return [e["node"] for e in nodes if isinstance(e, dict)]

def page_teachers_by_text(school_id, text_filter, page_size=100, max_pages=50):
    teachers = {}
    after = None
    page = 0
    while True:
        page += 1
        res = gql(TEACHERS_PAGED_Q, {"text": text_filter, "schoolID": school_id, "first": page_size, "after": after})
        # errors -> return what we have (usually empty)
        if res.get("errors"):
            # server-side text search may not accept department-like text for filtering
            return []
        block = res.get("data",{}).get("newSearch",{}).get("teachers")
        if not block:
            return []
        for e in block.get("edges", []) or []:
            node = e.get("node") or {}
            tid = node.get("id")
            if tid:
                teachers[tid] = node
        pi = block.get("pageInfo") or {}
        if pi.get("hasNextPage"):
            after = pi.get("endCursor")
            if page >= max_pages:
                break
            time.sleep(0.06)
            continue
        break
    return list(teachers.values())

def page_all_teachers_and_filter(school_id, dep_sub, page_size=100, max_pages=500):
    teachers = {}
    after = None
    page = 0
    while True:
        page += 1
        res = gql(TEACHERS_PAGED_Q, {"text": "", "schoolID": school_id, "first": page_size, "after": after})
        if res.get("errors"):
            break
        block = res.get("data",{}).get("newSearch",{}).get("teachers")
        if not block:
            break
        for e in block.get("edges", []) or []:
            node = e.get("node") or {}
            tid = node.get("id")
            if tid:
                teachers[tid] = node
        pi = block.get("pageInfo") or {}
        if pi.get("hasNextPage"):
            after = pi.get("endCursor")
            if page >= max_pages:
                break
            time.sleep(0.06)
            continue
        break
    dep_lower = (dep_sub or "").lower()
    filtered = [t for t in teachers.values() if dep_lower in (t.get("department") or "").lower()]
    return filtered

# --- Ratings fetcher & course matcher ----------------------------------------
def build_ratings_query(rating_fields):
    """
    Build a rating query selecting rating_fields fields for each rating node.
    rating_fields should be a list like ['id','date','comment','class','ratingTags'].
    """
    sel = "\n            ".join(rating_fields)
    q = f"""
    query GetRatings($id: ID!, $first: Int!, $after: String) {{
      node(id: $id) {{
        ... on Teacher {{
          ratings(first: $first, after: $after) {{
            pageInfo {{ hasNextPage endCursor }}
            edges {{
              node {{
                {sel}
              }}
            }}
          }}
        }}
      }}
    }}
    """
    return q

def normalize_course_token(course_raw):
    # normalize inputs like 'CIS375', 'CIS 375', '375' -> dept token + number if possible
    s = str(course_raw).strip()
    # separate alpha prefix and number suffix
    m = re.match(r"^([A-Za-z]{1,6})\s*[-]?\s*(\d{2,4}[A-Za-z]?)$", s)
    if m:
        return m.group(1).upper(), m.group(2).upper()
    m2 = re.match(r"^(\d{2,4}[A-Za-z]?)$", s)
    if m2:
        return None, m2.group(1).upper()
    # fallback: try to split non-digit/digit boundary
    alpha = "".join(re.findall(r"[A-Za-z]+", s))
    num = "".join(re.findall(r"\d+\w*", s))
    return (alpha.upper() if alpha else None, num.upper() if num else None)

def rating_pages_for_teacher(teacher_id, rating_query_text, per_page=50, max_pages=40):
    after = None
    page = 0
    all_ratings = []
    while True:
        page += 1
        res = gql(rating_query_text, {"id": teacher_id, "first": per_page, "after": after})
        if res.get("errors"):
            # schema mismatch possibly; return what we have (caller will adapt)
            return {"errors": res.get("errors"), "ratings": all_ratings}
        node = res.get("data",{}).get("node")
        if not node:
            return {"ratings": all_ratings}
        ratings_block = node.get("ratings") or {}
        edges = ratings_block.get("edges") or []
        for e in edges:
            rnode = e.get("node")
            if rnode:
                all_ratings.append(rnode)
        pi = ratings_block.get("pageInfo") or {}
        if pi.get("hasNextPage"):
            after = pi.get("endCursor")
            if page >= max_pages:
                break
            time.sleep(0.06)
            continue
        break
    return {"ratings": all_ratings}

def professor_teaches_course_from_ratings(ratings, course_dept_token, course_number):
    """
    Return True if at least one rating suggests this course.
    Checks structured class/course fields and the comment text.
    """
    num = course_number
    dept = (course_dept_token or "").lower()
    # patterns to match: "CIS375", "CIS 375", "CIS-375", "375"
    pats = []
    if dept:
        pats.append(re.compile(rf"\b{re.escape(dept)}\s*[-]?\s*{re.escape(num)}\b", re.IGNORECASE))
        pats.append(re.compile(rf"\b{re.escape(dept)}{re.escape(num)}\b", re.IGNORECASE))
    pats.append(re.compile(rf"\b{re.escape(num)}\b"))
    for r in ratings:
        # check class/course-like fields (we don't know name - caller placed probable fields into r)
        for v in r.values():
            try:
                if not v:
                    continue
                s = str(v)
                for p in pats:
                    if p.search(s):
                        return True
            except Exception:
                continue
    return False

# --- Main extraction procedure ------------------------------------------------
def extract(school_name, department_sub, course_string, dept_code_override=None):
    # 1) introspect rating & teacher tag fields
    rating_info = pick_rating_field_candidates()
    teacher_tag_field, teacher_tag_name_field = find_teacher_tag_info()
    # Prepare rating fields to request: choose a safe set: id, date, comment, plus discovered class-like fields and ratingTags
    rating_fields = ["id"]
    # date
    rating_fields.append("date")
    # comment
    rating_fields.append(rating_info.get("comment") or "comment")
    # include all discovered class-like fields (server may return None for many)
    for cf in rating_info.get("class_fields", []):
        rating_fields.append(cf)
    # include ratingTags if present
    if rating_info.get("ratingTags"):
        rating_fields.append(rating_info["ratingTags"])
    # dedupe while preserving order
    seen = set()
    rating_fields = [x for x in rating_fields if not (x in seen or seen.add(x))]
    ratings_q_text = build_ratings_query(rating_fields)

    # 2) locate school
    schools = search_school(school_name)
    if not schools:
        raise SystemExit("No school found for query: " + school_name)
    # prefer exact match else choose the one with matching city/substring
    chosen = None
    target = school_name.strip().lower()
    for s in schools:
        if s.get("name","").strip().lower() == target:
            chosen = s; break
    if not chosen:
        for s in schools:
            if target in s.get("name","").lower():
                chosen = s; break
    if not chosen:
        chosen = schools[0]
    school_id = chosen.get("id")

    # 3) get candidate teachers (try server-side text filter first)
    candidates = page_teachers_by_text(school_id, department_sub, page_size=100, max_pages=40)
    if not candidates:
        # fallback to paging entire teacher index and filter locally by department substring
        candidates = page_all_teachers_and_filter(school_id, department_sub, page_size=100, max_pages=500)

    # normalize course token
    dept_token, course_num = normalize_course_token(course_string)
    if dept_code_override:
        dept_token = dept_code_override.upper()

    matched_professors = []

    # 4) for each candidate teacher, page ratings (using constructed rating query), decide if they taught the course,
    #    and if yes extract only the required fields
    for t in candidates:
        teacher_id = t.get("id")
        name = f"{t.get('firstName','')} {t.get('lastName','')}".strip()
        # skip professors with no ratings quickly
        if (t.get("numRatings") or 0) == 0:
            continue
        # page ratings
        rp = rating_pages_for_teacher(teacher_id, ratings_q_text, per_page=50, max_pages=40)
        if rp.get("errors"):
            # schema mismatch (rare) - skip this teacher
            # you could adapt by trying alternate rating query shapes, but keep it simple
            continue
        ratings = rp.get("ratings") or []
        # determine if this teacher taught the course (by scanning ratings)
        taught = professor_teaches_course_from_ratings(ratings, dept_token, course_num)
        if not taught:
            continue
        # prepare required output fields
        # latest 3 comments (take the first 3 ratings' comment fields if present)
        latest_comments = []
        for r in ratings[:3]:
            # attempt to pick the comment field discovered earlier
            comment_field = rating_info.get("comment") or "comment"
            c = r.get(comment_field) or r.get("comment") or ""
            if c is None:
                c = ""
            latest_comments.append(c if isinstance(c, str) else str(c))
        # teacher tags (teacher-level aggregated tags): fetch from teacher node if available using a small query
        teacher_tag_names = []
        if teacher_tag_field and teacher_tag_name_field:
            # build a small teacher node query
            TQ = f"""
            query GetTeacherTags($id: ID!) {{
              node(id: $id) {{
                ... on Teacher {{
                  {teacher_tag_field} {{
                    {teacher_tag_name_field}
                  }}
                }}
              }}
            }}
            """
            tr = gql(TQ, {"id": teacher_id})
            if not tr.get("errors"):
                tag_nodes = tr.get("data",{}).get("node",{}).get(teacher_tag_field) or []
                for tag in tag_nodes:
                    tn = tag.get(teacher_tag_name_field)
                    if tn:
                        teacher_tag_names.append(tn)
        # assemble output object with only requested fields
        out = {
            "id": teacher_id,
            "name": name,
            "avgRating": t.get("avgRating"),
            "avgDifficulty": t.get("avgDifficulty"),
            "wouldTakeAgainPercent": t.get("wouldTakeAgainPercent"),
            "teacherTags": teacher_tag_names,
            "latestComments": latest_comments
        }
        matched_professors.append(out)
        # be polite
        time.sleep(0.08)

    return matched_professors

# --- CLI entrypoint ----------------------------------------------------------
def main():
    if len(sys.argv) < 4:
        print("Usage: python extract_course_professors.py \"School name\" \"Department substring\" \"CourseNumber\" [DeptCodeOptional]")
        sys.exit(1)
    school_name = sys.argv[1]
    department_sub = sys.argv[2]
    course_string = sys.argv[3]
    dept_code_override = sys.argv[4] if len(sys.argv) >= 5 else None

    try:
        results = extract(school_name, department_sub, course_string, dept_code_override)
    except Exception as e:
        print("Error:", e)
        sys.exit(2)

    # print only the requested data as JSON
    print(json.dumps(results, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()

