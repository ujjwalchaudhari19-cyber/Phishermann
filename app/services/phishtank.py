import random
from datetime import datetime, timezone, timedelta

def get_aggregated_trends() -> dict:
    """
    Mock fetching aggregated data from PhishTank + APWG databases.
    In a real app, this would hit their feeds or query our synced postgres tables.
    """
    
    # Generate some mock trend data over 30 days
    trend_data = []
    base_date = datetime.now(timezone.utc) - timedelta(days=30)
    for i in range(30):
        current_date = base_date + timedelta(days=i)
        trend_data.append({
            "date": current_date.strftime("%Y-%m-%d"),
            "count": random.randint(100, 1500)
        })

    return {
        "total_threats_today": random.randint(500, 5000),
        "top_scam_types": [
            {"type": "Credential Harvesting", "percentage": 45},
            {"type": "Financial Fraud", "percentage": 30},
            {"type": "Malware Delivery", "percentage": 15},
            {"type": "Extortion", "percentage": 10}
        ],
        "top_targeted_regions": [
            {"region": "North America", "count": 12000},
            {"region": "Western Europe", "count": 8500},
            {"region": "Asia Pacific", "count": 6200},
            {"region": "South America", "count": 1100}
        ],
        "trend_data": trend_data
    }
