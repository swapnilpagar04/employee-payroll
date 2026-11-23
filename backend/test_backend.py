"""
Unit test suite for Supabase-backed Payroll REST API.
"""

import json
import os
import sys
import unittest
from unittest.mock import patch, MagicMock

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
import database


class TestSupabasePayrollAPI(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_unconfigured_supabase_returns_503(self):
        with patch.object(database, "is_supabase_configured", return_value=False):
            res = self.client.get("/api/dashboard")
            self.assertEqual(res.status_code, 503)
            data = res.get_json()
            self.assertIn("error", data)
            self.assertIn("SUPABASE_URL", data["error"])

    @patch("database.is_supabase_configured", return_value=True)
    @patch("database.get_dashboard_data")
    def test_dashboard_endpoint(self, mock_get_dashboard, mock_conf):
        mock_get_dashboard.return_value = {
            "total_employees": 4,
            "total_departments": 4,
            "total_monthly_payroll": 21300.0,
            "total_payrolls_count": 3,
            "recent_employees": [],
            "recent_payrolls": []
        }
        res = self.client.get("/api/dashboard")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["total_employees"], 4)
        self.assertEqual(data["total_monthly_payroll"], 21300.0)

    @patch("database.is_supabase_configured", return_value=True)
    @patch("database.get_all_employees")
    def test_get_employees_endpoint(self, mock_get_employees, mock_conf):
        mock_get_employees.return_value = [
            {"id": 1, "emp_id": "EMP001", "name": "John Doe", "department": "Engineering"}
        ]
        res = self.client.get("/api/employees")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["emp_id"], "EMP001")

    @patch("database.is_supabase_configured", return_value=True)
    @patch("database.get_employee_by_id")
    @patch("database.add_payroll")
    def test_payroll_net_salary_calculation(self, mock_add_payroll, mock_get_emp, mock_conf):
        mock_get_emp.return_value = {"id": 1, "emp_id": "EMP001", "name": "John Doe"}
        mock_add_payroll.side_effect = lambda payload: (payload, None)

        payload = {
            "employee_id": 1,
            "month": "November 2026",
            "basic_salary": 5000.0,
            "hra": 1000.0,
            "allowances": 400.0,
            "bonus": 300.0,
            "deductions": 700.0
        }
        res = self.client.post("/api/payroll", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        
        # Gross = 5000 + 1000 + 400 + 300 = 6700.00
        # Net = 6700 - 700 = 6000.00
        self.assertEqual(data["gross_salary"], 6700.0)
        self.assertEqual(data["net_salary"], 6000.0)

    @patch("database.is_supabase_configured", return_value=True)
    def test_payroll_negative_deductions_or_components(self, mock_conf):
        payload = {
            "employee_id": 1,
            "month": "November 2026",
            "basic_salary": 5000.0,
            "deductions": -100.0
        }
        res = self.client.post("/api/payroll", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("cannot be negative", res.get_json()["error"])

    @patch("database.is_supabase_configured", return_value=True)
    def test_payroll_deductions_exceed_gross(self, mock_conf):
        payload = {
            "employee_id": 1,
            "month": "November 2026",
            "basic_salary": 1000.0,
            "deductions": 2000.0
        }
        res = self.client.post("/api/payroll", json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Net salary cannot be negative", res.get_json()["error"])


if __name__ == "__main__":
    unittest.main()
