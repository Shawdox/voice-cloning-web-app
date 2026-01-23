import os
from fishaudio import FishAudio
from dotenv import load_dotenv
load_dotenv()

try:
    api_key=os.getenv("FISH_API_KEY")
    client = FishAudio(api_key=api_key)
    credits = client.account.get_credits(check_free_credit=True)
    #print(f"Type: {type(credits)}")
    print(f"Credits: {credits.credit}")
    print(f"ID: {credits.user_id}")
    #print(f"All info: {credits}")
    print("----")
    package = client.account.get_package()
    print(f"Balance: {package.balance}/{package.total}")
except Exception as e:
    print(e)
