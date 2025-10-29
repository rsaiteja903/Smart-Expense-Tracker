import requests
import sys
import json
from datetime import datetime
import io
from PIL import Image

class ExpenseAnalyzerAPITester:
    def __init__(self, base_url="https://finance-genie-2.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response text: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self, name, email, password):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"name": name, "email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_get_categories(self):
        """Test get categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return success, response

    def test_create_expense(self, amount, category, description, date):
        """Test create expense"""
        success, response = self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,
            data={
                "amount": amount,
                "category": category,
                "description": description,
                "date": date
            }
        )
        return success, response.get('id') if success else None

    def test_get_expenses(self):
        """Test get expenses"""
        success, response = self.run_test(
            "Get Expenses",
            "GET",
            "expenses",
            200
        )
        return success, response

    def test_get_expense(self, expense_id):
        """Test get single expense"""
        success, response = self.run_test(
            "Get Single Expense",
            "GET",
            f"expenses/{expense_id}",
            200
        )
        return success

    def test_update_expense(self, expense_id, amount, description):
        """Test update expense"""
        success, response = self.run_test(
            "Update Expense",
            "PUT",
            f"expenses/{expense_id}",
            200,
            data={"amount": amount, "description": description}
        )
        return success

    def test_delete_expense(self, expense_id):
        """Test delete expense"""
        success, response = self.run_test(
            "Delete Expense",
            "DELETE",
            f"expenses/{expense_id}",
            200
        )
        return success

    def test_analytics_summary(self):
        """Test analytics summary"""
        success, response = self.run_test(
            "Analytics Summary",
            "GET",
            "analytics/summary",
            200
        )
        return success, response

    def test_ai_insights(self):
        """Test AI insights generation"""
        success, response = self.run_test(
            "AI Insights",
            "GET",
            "analytics/insights",
            200
        )
        return success, response

    def test_receipt_upload(self):
        """Test receipt upload with OCR"""
        # Create a simple test image
        img = Image.new('RGB', (200, 100), color='white')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        files = {'file': ('test_receipt.png', img_bytes, 'image/png')}
        
        success, response = self.run_test(
            "Receipt Upload OCR",
            "POST",
            "receipts/upload",
            200,
            files=files
        )
        return success, response

def main():
    print("🚀 Starting Smart Expense Analyzer API Tests")
    print("=" * 50)
    
    # Setup
    tester = ExpenseAnalyzerAPITester()
    test_timestamp = datetime.now().strftime('%H%M%S')
    test_email = f"test_{test_timestamp}@example.com"
    test_password = "TestPass123!"
    
    # Test user registration
    if not tester.test_register("Test User", test_email, test_password):
        print("❌ Registration failed, trying login with existing user")
        if not tester.test_login("test@example.com", "test123456"):
            print("❌ Login with existing user also failed, stopping tests")
            return 1

    # Test authentication endpoints
    if not tester.test_get_me():
        print("❌ Get current user failed")
        return 1

    # Test categories
    categories_success, categories = tester.test_get_categories()
    if not categories_success:
        print("❌ Get categories failed")
        return 1

    # Test expense CRUD operations
    expense_id = tester.test_create_expense(
        25.50, 
        "Food", 
        "Test lunch expense", 
        "2024-01-15"
    )
    if not expense_id:
        print("❌ Create expense failed")
        return 1

    # Test get expenses
    expenses_success, expenses = tester.test_get_expenses()
    if not expenses_success:
        print("❌ Get expenses failed")
        return 1

    # Test get single expense
    if not tester.test_get_expense(expense_id):
        print("❌ Get single expense failed - continuing with other tests")

    # Test update expense
    if not tester.test_update_expense(expense_id, 30.00, "Updated test expense"):
        print("❌ Update expense failed - continuing with other tests")

    # Test analytics
    analytics_success, analytics = tester.test_analytics_summary()
    if not analytics_success:
        print("❌ Analytics summary failed")
        return 1

    # Test AI insights (may take longer)
    print("\n⏳ Testing AI insights (this may take a few seconds)...")
    insights_success, insights = tester.test_ai_insights()
    if not insights_success:
        print("❌ AI insights failed")
    else:
        print(f"✅ AI insights generated: {len(insights.get('insights', []))} insights")

    # Test receipt upload OCR
    receipt_success, receipt_data = tester.test_receipt_upload()
    if not receipt_success:
        print("❌ Receipt upload failed")
    else:
        print(f"✅ Receipt processed - Amount: {receipt_data.get('amount')}, Category: {receipt_data.get('category')}")

    # Test delete expense (do this last)
    if not tester.test_delete_expense(expense_id):
        print("❌ Delete expense failed - continuing")

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())