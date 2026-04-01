import requests
import sys
from datetime import datetime
import json

class CraftBoltAPITester:
    def __init__(self, base_url="https://builder-hub-309.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.customer_token = None
        self.supplier_token = None
        self.test_demand_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic API health"""
        return self.run_test("Health Check", "GET", "", 200)

    def test_categories(self):
        """Test categories endpoint"""
        success, response = self.run_test("Get Categories", "GET", "categories", 200)
        if success and 'categories' in response:
            categories = response['categories']
            print(f"   Found {len(categories)} categories")
            if len(categories) >= 60:  # Should have 61 categories
                print("   ✅ Categories count looks good")
            else:
                print(f"   ⚠️  Expected ~61 categories, got {len(categories)}")
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@craftbolt.cz", "password": "CraftBolt2026!"}
        )
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            user = response.get('user', {})
            print(f"   ✅ Admin logged in: {user.get('email')} (Role: {user.get('role')})")
            return True
        return False

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200,
            token=self.admin_token
        )
        if success:
            print(f"   Stats: {response}")
        return success

    def test_customer_registration(self):
        """Test customer registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        customer_data = {
            "email": f"customer_{timestamp}@test.cz",
            "password": "TestPass123!",
            "phone": "+420123456789",
            "role": "customer",
            "company_name": "Test Customer"
        }
        
        success, response = self.run_test(
            "Customer Registration",
            "POST",
            "auth/register",
            200,
            data=customer_data
        )
        if success and 'access_token' in response:
            self.customer_token = response['access_token']
            user = response.get('user', {})
            print(f"   ✅ Customer registered: {user.get('email')}")
            return True
        return False

    def test_supplier_registration(self):
        """Test supplier registration (OSVČ type)"""
        timestamp = datetime.now().strftime('%H%M%S')
        supplier_data = {
            "email": f"supplier_{timestamp}@test.cz",
            "password": "TestPass123!",
            "phone": "+420987654321",
            "role": "supplier",
            "supplier_type": "osvc",
            "company_name": "Test OSVČ",
            "ico": "12345678",
            "address": "Praha 1, Česká republika",
            "categories": ["Instalatérství", "Elektroinstalace"]
        }
        
        success, response = self.run_test(
            "Supplier Registration (OSVČ)",
            "POST",
            "auth/register",
            200,
            data=supplier_data
        )
        if success and 'access_token' in response:
            self.supplier_token = response['access_token']
            user = response.get('user', {})
            print(f"   ✅ Supplier registered: {user.get('email')} (Type: {user.get('supplier_type')})")
            return True
        return False

    def test_create_demand(self):
        """Test creating a demand as customer"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
        
        demand_data = {
            "title": "Test oprava elektroinstalace",
            "description": "Potřebuji opravit elektroinstalaci v kuchyni. Nefunguje zásuvka.",
            "category": "Instalatérství",
            "address": "Praha 2, Vinohrady",
            "budget_min": 1000,
            "budget_max": 5000
        }
        
        success, response = self.run_test(
            "Create Demand",
            "POST",
            "demands",
            200,
            data=demand_data,
            token=self.customer_token
        )
        if success and 'id' in response:
            self.test_demand_id = response['id']
            print(f"   ✅ Demand created with ID: {self.test_demand_id}")
            return True
        return False

    def test_view_available_demands(self):
        """Test supplier viewing available demands"""
        if not self.supplier_token:
            print("❌ No supplier token available")
            return False
        
        success, response = self.run_test(
            "View Available Demands",
            "GET",
            "demands/available",
            200,
            token=self.supplier_token
        )
        if success:
            demands = response if isinstance(response, list) else []
            print(f"   ✅ Found {len(demands)} available demands")
            return True
        return False

    def test_accept_demand(self):
        """Test supplier accepting a demand"""
        if not self.supplier_token or not self.test_demand_id:
            print("❌ No supplier token or demand ID available")
            return False
        
        success, response = self.run_test(
            "Accept Demand",
            "POST",
            f"demands/{self.test_demand_id}/accept",
            200,
            token=self.supplier_token
        )
        return success

    def test_send_message(self):
        """Test sending a message in chat"""
        if not self.customer_token or not self.test_demand_id:
            print("❌ No customer token or demand ID available")
            return False
        
        message_data = {
            "demand_id": self.test_demand_id,
            "content": "Dobrý den, kdy byste mohli přijet na prohlídku?"
        }
        
        success, response = self.run_test(
            "Send Message",
            "POST",
            "messages",
            200,
            data=message_data,
            token=self.customer_token
        )
        return success

    def test_get_messages(self):
        """Test getting messages for a demand"""
        if not self.customer_token or not self.test_demand_id:
            print("❌ No customer token or demand ID available")
            return False
        
        success, response = self.run_test(
            "Get Messages",
            "GET",
            f"messages/{self.test_demand_id}",
            200,
            token=self.customer_token
        )
        if success:
            messages = response if isinstance(response, list) else []
            print(f"   ✅ Found {len(messages)} messages")
        return success

    def test_user_profile(self):
        """Test getting user profile"""
        if not self.customer_token:
            print("❌ No customer token available")
            return False
        
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200,
            token=self.customer_token
        )
        if success:
            print(f"   ✅ Profile: {response.get('email')} (Role: {response.get('role')})")
        return success

def main():
    print("🚀 Starting CraftBolt API Tests")
    print("=" * 50)
    
    tester = CraftBoltAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Categories", tester.test_categories),
        ("Admin Login", tester.test_admin_login),
        ("Admin Stats", tester.test_admin_stats),
        ("Customer Registration", tester.test_customer_registration),
        ("Supplier Registration", tester.test_supplier_registration),
        ("User Profile", tester.test_user_profile),
        ("Create Demand", tester.test_create_demand),
        ("View Available Demands", tester.test_view_available_demands),
        ("Accept Demand", tester.test_accept_demand),
        ("Send Message", tester.test_send_message),
        ("Get Messages", tester.test_get_messages),
    ]
    
    print(f"\n📋 Running {len(tests)} test scenarios...")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            tester.failed_tests.append(f"{test_name}: Exception - {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "0%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failure in tester.failed_tests:
            print(f"  - {failure}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())