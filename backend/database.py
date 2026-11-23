"""
Database layer for Employee Payroll System using Supabase.
All SQLite code has been removed. All data operations use the Supabase PostgREST API.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import requests

# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

# Supabase Credentials
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://YOUR_PROJECT_ID.supabase.co").strip().rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_eevThvCccRtvYH4hRLOwVA_nVmvozJ9").strip()

REST_URL = f"{SUPABASE_URL}/rest/v1"


def get_headers():
    """Return standard Supabase PostgREST authentication and format headers."""
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def is_supabase_configured() -> bool:
    """Check if the user has replaced the placeholder Supabase URL with their real project URL."""
    return bool(
        SUPABASE_URL
        and "YOUR_PROJECT_ID" not in SUPABASE_URL
        and SUPABASE_URL.startswith("http")
    )


def check_connection():
    """Verify connectivity with the Supabase project."""
    if not is_supabase_configured():
        return False, "SUPABASE_URL is not configured. Please update backend/.env with your Supabase Project URL."
    try:
        res = requests.get(f"{REST_URL}/employees?select=id&limit=1", headers=get_headers(), timeout=5)
        if res.status_code in (200, 206):
            return True, "Connected to Supabase successfully."
        elif res.status_code == 404 or "relation \"public.employees\" does not exist" in res.text:
            return False, "Connected to Supabase, but the 'employees' table does not exist. Please run supabase_schema.sql in the Supabase SQL Editor."
        else:
            return False, f"Supabase responded with status {res.status_code}: {res.text}"
    except Exception as e:
        return False, f"Could not reach Supabase at {SUPABASE_URL}: {str(e)}"


# -----------------------------------------------------------------------------
# DASHBOARD
# -----------------------------------------------------------------------------
def get_dashboard_data():
    """Aggregate statistics for dashboard cards and recent activity tables."""
    # 1. Fetch all employees
    emp_res = requests.get(
        f"{REST_URL}/employees?select=*&order=id.desc",
        headers=get_headers(),
        timeout=8
    )
    if emp_res.status_code not in (200, 206):
        raise RuntimeError(f"Supabase error fetching employees: {emp_res.text}")

    employees = emp_res.json()
    total_employees = len(employees)
    departments = set(e.get("department") for e in employees if e.get("department"))
    total_departments = len(departments)
    recent_employees = employees[:5]

    # 2. Fetch all payrolls with joined employee info
    pay_res = requests.get(
        f"{REST_URL}/payrolls?select=*,employees(name,emp_id,department)&order=id.desc",
        headers=get_headers(),
        timeout=8
    )
    if pay_res.status_code not in (200, 206):
        raise RuntimeError(f"Supabase error fetching payrolls: {pay_res.text}")

    payrolls_raw = pay_res.json()
    total_monthly_payroll = sum(float(p.get("net_salary", 0)) for p in payrolls_raw)
    total_payrolls_count = len(payrolls_raw)

    recent_payrolls = []
    for p in payrolls_raw[:5]:
        emp_info = p.get("employees") or {}
        recent_payrolls.append({
            "id": p["id"],
            "month": p.get("month", ""),
            "gross_salary": float(p.get("gross_salary", 0)),
            "net_salary": float(p.get("net_salary", 0)),
            "created_at": p.get("created_at", ""),
            "employee_name": emp_info.get("name", "Unknown"),
            "emp_id": emp_info.get("emp_id", ""),
            "department": emp_info.get("department", "")
        })

    return {
        "total_employees": total_employees,
        "total_departments": total_departments,
        "total_monthly_payroll": round(total_monthly_payroll, 2),
        "total_payrolls_count": total_payrolls_count,
        "recent_employees": recent_employees,
        "recent_payrolls": recent_payrolls
    }


# -----------------------------------------------------------------------------
# EMPLOYEES CRUD
# -----------------------------------------------------------------------------
def get_all_employees(search_query: str = ""):
    """Fetch employees, optionally filtered by name, ID, or department."""
    res = requests.get(
        f"{REST_URL}/employees?select=*&order=id.desc",
        headers=get_headers(),
        timeout=8
    )
    if res.status_code not in (200, 206):
        raise RuntimeError(f"Supabase error: {res.text}")

    employees = res.json()
    if search_query:
        q = search_query.strip().lower()
        employees = [
            e for e in employees
            if q in str(e.get("name", "")).lower()
            or q in str(e.get("emp_id", "")).lower()
            or q in str(e.get("department", "")).lower()
        ]
    return employees


def get_employee_by_id(emp_db_id: int):
    """Retrieve a single employee by primary key ID."""
    res = requests.get(
        f"{REST_URL}/employees?id=eq.{emp_db_id}&select=*",
        headers=get_headers(),
        timeout=8
    )
    if res.status_code not in (200, 206):
        raise RuntimeError(f"Supabase error: {res.text}")

    data = res.json()
    return data[0] if data else None


def add_employee(data: dict):
    """Insert a new employee in Supabase."""
    emp_id = str(data["emp_id"]).strip().upper()

    # Check for duplicate emp_id
    check_res = requests.get(
        f"{REST_URL}/employees?emp_id=eq.{emp_id}&select=id",
        headers=get_headers(),
        timeout=8
    )
    if check_res.status_code in (200, 206) and len(check_res.json()) > 0:
        return None, f"Employee ID '{emp_id}' already exists."

    payload = {
        "emp_id": emp_id,
        "name": str(data["name"]).strip(),
        "email": str(data["email"]).strip(),
        "phone": str(data["phone"]).strip(),
        "department": str(data["department"]).strip(),
        "designation": str(data["designation"]).strip(),
        "joining_date": str(data["joining_date"]).strip(),
        "basic_salary": float(data["basic_salary"])
    }

    res = requests.post(
        f"{REST_URL}/employees",
        headers=get_headers(),
        json=payload,
        timeout=8
    )
    if res.status_code not in (200, 201):
        return None, f"Supabase insert failed: {res.text}"

    created = res.json()
    return (created[0] if isinstance(created, list) else created), None


def update_employee(emp_db_id: int, data: dict):
    """Update existing employee details in Supabase."""
    payload = {}
    if "name" in data: payload["name"] = str(data["name"]).strip()
    if "email" in data: payload["email"] = str(data["email"]).strip()
    if "phone" in data: payload["phone"] = str(data["phone"]).strip()
    if "department" in data: payload["department"] = str(data["department"]).strip()
    if "designation" in data: payload["designation"] = str(data["designation"]).strip()
    if "joining_date" in data: payload["joining_date"] = str(data["joining_date"]).strip()
    if "basic_salary" in data: payload["basic_salary"] = float(data["basic_salary"])

    res = requests.patch(
        f"{REST_URL}/employees?id=eq.{emp_db_id}",
        headers=get_headers(),
        json=payload,
        timeout=8
    )
    if res.status_code not in (200, 204):
        return None, f"Supabase update failed: {res.text}"

    updated = res.json()
    return (updated[0] if isinstance(updated, list) and updated else None), None


def delete_employee(emp_db_id: int):
    """Delete an employee and their payrolls from Supabase."""
    res = requests.delete(
        f"{REST_URL}/employees?id=eq.{emp_db_id}",
        headers=get_headers(),
        timeout=8
    )
    return res.status_code in (200, 204)


# -----------------------------------------------------------------------------
# PAYROLLS CRUD
# -----------------------------------------------------------------------------
def get_all_payrolls(month_filter: str = "", emp_filter: str = ""):
    """Fetch all payroll records joined with employee details."""
    query_url = f"{REST_URL}/payrolls?select=*,employees(name,emp_id,email,phone,department,designation,joining_date)&order=id.desc"
    if month_filter:
        query_url += f"&month=eq.{month_filter}"

    res = requests.get(query_url, headers=get_headers(), timeout=8)
    if res.status_code not in (200, 206):
        raise RuntimeError(f"Supabase error fetching payrolls: {res.text}")

    payrolls_raw = res.json()
    records = []
    for p in payrolls_raw:
        emp_info = p.get("employees") or {}
        record = {
            "id": p["id"],
            "employee_id": p.get("employee_id"),
            "month": p.get("month", ""),
            "basic_salary": float(p.get("basic_salary", 0)),
            "hra": float(p.get("hra", 0)),
            "allowances": float(p.get("allowances", 0)),
            "bonus": float(p.get("bonus", 0)),
            "deductions": float(p.get("deductions", 0)),
            "gross_salary": float(p.get("gross_salary", 0)),
            "net_salary": float(p.get("net_salary", 0)),
            "created_at": p.get("created_at", ""),
            "employee_name": emp_info.get("name", "Unknown"),
            "emp_id": emp_info.get("emp_id", ""),
            "email": emp_info.get("email", ""),
            "phone": emp_info.get("phone", ""),
            "department": emp_info.get("department", ""),
            "designation": emp_info.get("designation", ""),
            "joining_date": emp_info.get("joining_date", "")
        }

        if emp_filter:
            q = emp_filter.strip().lower()
            if not (q in record["employee_name"].lower() or q in record["emp_id"].lower() or q == str(record["employee_id"])):
                continue

        records.append(record)

    return records


def get_payroll_by_id(payroll_id: int):
    """Fetch single payroll joined with employee metadata for the salary slip."""
    res = requests.get(
        f"{REST_URL}/payrolls?id=eq.{payroll_id}&select=*,employees(name,emp_id,email,phone,department,designation,joining_date)",
        headers=get_headers(),
        timeout=8
    )
    if res.status_code not in (200, 206):
        raise RuntimeError(f"Supabase error: {res.text}")

    data = res.json()
    if not data:
        return None

    p = data[0]
    emp_info = p.get("employees") or {}
    return {
        "id": p["id"],
        "employee_id": p.get("employee_id"),
        "month": p.get("month", ""),
        "basic_salary": float(p.get("basic_salary", 0)),
        "hra": float(p.get("hra", 0)),
        "allowances": float(p.get("allowances", 0)),
        "bonus": float(p.get("bonus", 0)),
        "deductions": float(p.get("deductions", 0)),
        "gross_salary": float(p.get("gross_salary", 0)),
        "net_salary": float(p.get("net_salary", 0)),
        "created_at": p.get("created_at", ""),
        "employee_name": emp_info.get("name", "Unknown"),
        "emp_id": emp_info.get("emp_id", ""),
        "email": emp_info.get("email", ""),
        "phone": emp_info.get("phone", ""),
        "department": emp_info.get("department", ""),
        "designation": emp_info.get("designation", ""),
        "joining_date": emp_info.get("joining_date", "")
    }


def add_payroll(payload: dict):
    """Insert a new payroll record in Supabase."""
    res = requests.post(
        f"{REST_URL}/payrolls",
        headers=get_headers(),
        json=payload,
        timeout=8
    )
    if res.status_code not in (200, 201):
        return None, f"Supabase insert failed: {res.text}"

    created = res.json()
    new_id = created[0]["id"] if isinstance(created, list) else created["id"]
    return get_payroll_by_id(new_id), None


def delete_payroll(payroll_id: int):
    """Delete a payroll record from Supabase."""
    res = requests.delete(
        f"{REST_URL}/payrolls?id=eq.{payroll_id}",
        headers=get_headers(),
        timeout=8
    )
    return res.status_code in (200, 204)
