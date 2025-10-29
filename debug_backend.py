import requests
import json

# Test the expense creation and retrieval issue
base_url = "https://finance-genie-2.preview.emergentagent.com/api"

# First login to get token
login_response = requests.post(f"{base_url}/auth/login", json={
    "email": "test@example.com",
    "password": "test123456"
})

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Create an expense
    expense_data = {
        "amount": 15.99,
        "category": "Food",
        "description": "Debug test expense",
        "date": "2024-01-15"
    }
    
    create_response = requests.post(f"{base_url}/expenses", json=expense_data, headers=headers)
    print(f"Create expense status: {create_response.status_code}")
    
    if create_response.status_code == 200:
        created_expense = create_response.json()
        print(f"Created expense: {json.dumps(created_expense, indent=2)}")
        expense_id = created_expense.get('id')
        
        # Try to get all expenses to see the structure
        all_expenses_response = requests.get(f"{base_url}/expenses", headers=headers)
        print(f"\nGet all expenses status: {all_expenses_response.status_code}")
        
        if all_expenses_response.status_code == 200:
            all_expenses = all_expenses_response.json()
            print(f"All expenses: {json.dumps(all_expenses, indent=2)}")
            
            # Try to get the specific expense
            if expense_id:
                get_expense_response = requests.get(f"{base_url}/expenses/{expense_id}", headers=headers)
                print(f"\nGet single expense status: {get_expense_response.status_code}")
                if get_expense_response.status_code != 200:
                    print(f"Error: {get_expense_response.json()}")
else:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)