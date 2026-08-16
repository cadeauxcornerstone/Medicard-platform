import hid
import sys

VID = 0xFFFF
PID = 0x0035

print("=" * 60)
print("MEDCARD NFC READER - HID CONNECTION TEST")
print("=" * 60)

devices = hid.enumerate(VID, PID)

print(f"\nFound {len(devices)} HID interfaces.")

reader = None

for device in devices:
    print(
        f"\nInterface {device.get('interface_number')}: "
        f"{device.get('product_string')} "
        f"UsagePage=0x{device.get('usage_page', 0):04X}"
    )

    if (
        device.get("interface_number") == 1
        and device.get("usage_page") == 0xFFA0
    ):
        reader = device
        break

if reader is None:
    print("\n❌ UserDefHid interface not found.")
    sys.exit(1)

print("\n✅ UserDefHid interface found!")
print("Opening reader...")

device = hid.device()

try:
    device.open_path(reader["path"])

    print("✅ Reader opened successfully!")
    print(f"Manufacturer: {device.get_manufacturer_string()}")
    print(f"Product:      {device.get_product_string()}")
    print(f"Serial:       {device.get_serial_number_string()}")

except Exception as e:
    print(f"\n❌ Could not open reader:")
    print(e)
    sys.exit(1)

finally:
    try:
        device.close()
    except:
        pass

print("\nConnection test complete.")