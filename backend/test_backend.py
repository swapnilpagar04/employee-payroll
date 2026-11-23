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


if __name__ == "__main__":
    unittest.main()
