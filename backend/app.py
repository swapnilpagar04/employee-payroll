"""
Flask REST API for Employee Payroll Management System.
Powered by Supabase Database (SQLite has been completely removed).
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import database

app = Flask(__name__)
# Enable CORS for all routes so the React frontend can communicate with Flask
CORS(app)


@app.before_request
def check_supabase_setup():
    """Verify that Supabase credentials have been configured before serving API requests."""
    # Allow health check or direct calls to return specific configuration guidance
    if not database.is_supabase_configured():
        return jsonify({
            "error": "SUPABASE_URL is not configured yet.",
            "message": "Please open 'backend/.env' and replace 'YOUR_PROJECT_ID' with your Supabase Project URL (e.g. https://xyzcompany.supabase.co). You can find this in your Supabase Dashboard under Project Settings -> API."
        }), 503


# -----------------------------------------------------------------------------
# DASHBOARD API
# -----------------------------------------------------------------------------
@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    """Retrieve statistical summary for dashboard cards and recent activity from Supabase."""
    try:
        data = database.get_dashboard_data()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch dashboard data: {str(e)}"}), 500


# -----------------------------------------------------------------------------
# EMPLOYEE CRUD APIS
# -----------------------------------------------------------------------------
@app.route("/api/employees", methods=["GET"])
def get_employees():
    """Get all employees from Supabase, with optional search query."""
    search_query = request.args.get("search", "").strip()
    try:
        employees = database.get_all_employees(search_query)
        return jsonify(employees), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch employees: {str(e)}"}), 500


@app.route("/api/employees/<int:id>", methods=["GET"])
def get_employee(id):
    """Retrieve a single employee by database ID."""
    try:
        emp = database.get_employee_by_id(id)
        if not emp:
            return jsonify({"error": "Employee not found"}), 404
        return jsonify(emp), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch employee: {str(e)}"}), 500


@app.route("/api/employees", methods=["POST"])
def add_employee():
    """Add a new employee to Supabase."""
    data = request.get_json() or {}

    required_fields = ["emp_id", "name", "email", "phone", "department", "designation", "joining_date", "basic_salary"]
    for field in required_fields:
        if field not in data or str(data[field]).strip() == "":
            return jsonify({"error": f"Field '{field}' is required."}), 400

    try:
        basic_salary = float(data["basic_salary"])
        if basic_salary < 0:
            return jsonify({"error": "Basic salary cannot be negative."}), 400
    except ValueError:
        return jsonify({"error": "Invalid numeric value for basic salary."}), 400

    try:
        created, error = database.add_employee(data)
        if error:
            status_code = 409 if "already exists" in error else 500
            return jsonify({"error": error}), status_code
        return jsonify(created), 201
    except Exception as e:
        return jsonify({"error": f"Failed to add employee: {str(e)}"}), 500


@app.route("/api/employees/<int:id>", methods=["PUT"])
def update_employee(id):
    """Update employee details in Supabase."""
    data = request.get_json() or {}
    try:
        existing = database.get_employee_by_id(id)
        if not existing:
            return jsonify({"error": "Employee not found"}), 404

        if "basic_salary" in data:
            try:
                if float(data["basic_salary"]) < 0:
                    return jsonify({"error": "Basic salary cannot be negative."}), 400
            except ValueError:
                return jsonify({"error": "Invalid basic salary value."}), 400

        updated, error = database.update_employee(id, data)
        if error:
            return jsonify({"error": error}), 500
        return jsonify(updated or existing), 200
    except Exception as e:
        return jsonify({"error": f"Failed to update employee: {str(e)}"}), 500


@app.route("/api/employees/<int:id>", methods=["DELETE"])
def delete_employee(id):
    """Delete an employee and their associated payrolls from Supabase."""
    try:
        existing = database.get_employee_by_id(id)
        if not existing:
            return jsonify({"error": "Employee not found"}), 404

        success = database.delete_employee(id)
        if not success:
            return jsonify({"error": "Failed to delete employee from Supabase."}), 500

        return jsonify({"message": "Employee deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete employee: {str(e)}"}), 500


# -----------------------------------------------------------------------------
# PAYROLL & SALARY SLIP APIS
# -----------------------------------------------------------------------------
@app.route("/api/payroll", methods=["GET"])
def get_payrolls():
    """Get all payroll records from Supabase with joined employee info."""
    month_filter = request.args.get("month", "").strip()
    emp_filter = request.args.get("employee_id", "").strip()
    try:
        payrolls = database.get_all_payrolls(month_filter, emp_filter)
        return jsonify(payrolls), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch payroll records: {str(e)}"}), 500


@app.route("/api/payroll/<int:id>", methods=["GET"])
def get_payroll_by_id(id):
    """Get a specific payroll record by ID joined with employee info for salary slip generation."""
    try:
        payroll = database.get_payroll_by_id(id)
        if not payroll:
            return jsonify({"error": "Payroll record not found"}), 404
        return jsonify(payroll), 200
    except Exception as e:
        return jsonify({"error": f"Failed to fetch payroll record: {str(e)}"}), 500


@app.route("/api/payroll", methods=["POST"])
def create_payroll():
    """
    Calculate and record an employee's payroll in Supabase.
    Formula:
        Gross Salary = Basic Salary + HRA + Allowances + Bonus
        Net Salary = Gross Salary - Deductions
    """
    data = request.get_json() or {}

    employee_id = data.get("employee_id")
    month = data.get("month", "").strip()

    if not employee_id or not month:
        return jsonify({"error": "Both 'employee_id' and 'month' are required."}), 400

    try:
        basic_salary = float(data.get("basic_salary", 0))
        hra = float(data.get("hra", 0))
        allowances = float(data.get("allowances", 0))
        bonus = float(data.get("bonus", 0))
        deductions = float(data.get("deductions", 0))

        if basic_salary < 0 or hra < 0 or allowances < 0 or bonus < 0 or deductions < 0:
            return jsonify({"error": "Salary components cannot be negative numbers."}), 400

        # Automatic Salary Calculations
        gross_salary = round(basic_salary + hra + allowances + bonus, 2)
        net_salary = round(gross_salary - deductions, 2)

        if net_salary < 0:
            return jsonify({"error": "Net salary cannot be negative. Total deductions cannot exceed gross salary."}), 400

    except (ValueError, TypeError):
        return jsonify({"error": "Salary components must be valid numbers."}), 400

    try:
        # Validate employee exists
        emp = database.get_employee_by_id(int(employee_id))
        if not emp:
            return jsonify({"error": "Selected employee does not exist in Supabase."}), 404

        payload = {
            "employee_id": int(employee_id),
            "month": month,
            "basic_salary": basic_salary,
            "hra": hra,
            "allowances": allowances,
            "bonus": bonus,
            "deductions": deductions,
            "gross_salary": gross_salary,
            "net_salary": net_salary
        }

        created, error = database.add_payroll(payload)
        if error:
            return jsonify({"error": error}), 500

        return jsonify(created), 201
    except Exception as e:
        return jsonify({"error": f"Failed to record payroll: {str(e)}"}), 500


@app.route("/api/payroll/<int:id>", methods=["DELETE"])
def delete_payroll(id):
    """Delete a payroll record from Supabase."""
    try:
        existing = database.get_payroll_by_id(id)
        if not existing:
            return jsonify({"error": "Payroll record not found"}), 404

        success = database.delete_payroll(id)
        if not success:
            return jsonify({"error": "Failed to delete payroll record from Supabase."}), 500

        return jsonify({"message": "Payroll record deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to delete payroll record: {str(e)}"}), 500


# -----------------------------------------------------------------------------
# APPLICATION ENTRYPOINT
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    print("==========================================================")
    print("  Employee Payroll Management System (Supabase Backend)")
    print("==========================================================")
    print(f"Supabase Key: {database.SUPABASE_KEY[:16]}... (Loaded)")
    if database.is_supabase_configured():
        print(f"Supabase URL: {database.SUPABASE_URL}")
        ok, msg = database.check_connection()
        print(f"Status: {msg}")
    else:
        print("[!] NOTICE: Please set your SUPABASE_URL in backend/.env")
        print("    Example: SUPABASE_URL=https://your-project-id.supabase.co")
    print("==========================================================")
    print("Starting Flask server on http://127.0.0.1:5000 ...")
    app.run(debug=True, host="127.0.0.1", port=5000)
