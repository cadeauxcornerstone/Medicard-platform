import hid
import sys

VID = 0xFFFF
PID = 0x0035

print("=" * 60)
print("MEDCARD NFC READER - HID DIAGNOSTICS")
print("=" * 60)

devices = hid.enumerate(VID, PID)

for i, d in enumerate(devices):
    print(f"\n--- Interface {i} ---")
    print("Product       :", d.get("product_string"))
    print("Manufacturer  :", d.get("manufacturer_string"))
    print("Serial        :", d.get("serial_number"))
    print("Interface     :", d.get("interface_number"))
    print("Usage Page    :", hex(d.get("usage_page", 0)))
    print("Usage         :", hex(d.get("usage", 0)))
    print("Path          :", d.get("path"))
    print("Max Input     :", d.get("max_input_report_size"))
    print("Max Output    :", d.get("max_output_report_size"))
    print("Max Feature   :", d.get("max_feature_report_size"))

print("\n" + "=" * 60)
print("Looking for UserDefHid...")
print("=" * 60)

reader = None

for d in devices:
    if (
        d.get("interface_number") == 1
        and d.get("usage_page") == 0xFFA0
    ):
        reader = d
        break

if reader is None:
    print("❌ UserDefHid not found")
    sys.exit(1)

print("✅ UserDefHid found")

device = hid.device()

try:
    device.open_path(reader["path"])

    print("\n✅ Device opened")

    print("\nDevice information:")
    print("Manufacturer:", device.get_manufacturer_string())
    print("Product     :", device.get_product_string())
    print("Serial      :", device.get_serial_number_string())

    print("\nTrying feature report...")

    try:
        data = device.get_feature_report(0, 64)

        print("Feature report received:")
        print("Length:", len(data))
        print("HEX   :", " ".join(f"{x:02X}" for x in data))

    except Exception as e:
        print("Feature report error:", repr(e))

except Exception as e:
    print("\n❌ Open error:")
    print(repr(e))

finally:
    try:
        device.close()
    except:
        pass

print("\nDone.")