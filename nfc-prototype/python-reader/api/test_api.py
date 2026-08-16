from api.medcard_api import identify_card


print("=" * 60)
print("MEDCARD PYTHON → EXPRESS API TEST")
print("=" * 60)

card_uid = "0118264579"

print(f"\nSending card UID: {card_uid}")

result = identify_card(card_uid)

print("\nBackend response:")
print(result)