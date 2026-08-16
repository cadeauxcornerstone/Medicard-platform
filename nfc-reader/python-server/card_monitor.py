import hid
import time
import sys

VID = 0xFFFF
PID = 0x0035
INTERFACE = 1

print("=" * 60)
print("MEDCARD NFC READER - FEATURE REPORT MONITOR")
print("=" * 60)

devices = hid.enumerate(VID, PID)

reader = None

for d in devices:
    if d.get("interface_number") == INTERFACE:
        reader = d
        break

if reader is None:
    print("❌ UserDefHid interface not found.")
    sys.exit(1)

device = hid.device()
device.open_path(reader["path"])

print("\n✅ Reader connected")
print("Product:", device.get_product_string())
print("Serial :", device.get_serial_number_string())

print("\n" + "=" * 60)
print("MONITORING FEATURE REPORTS")
print("=" * 60)
print("1. Leave the reader empty for 5 seconds.")
print("2. Tap your NFC card.")
print("3. Leave it there for 5 seconds.")
print("4. Remove it.")
print("5. Press Ctrl+C to stop.")
print("=" * 60)

last = {}

try:
    while True:

        for report_id in [1, 2, 3]:

            try:
                data = device.get_feature_report(report_id, 64)

                if data:
                    current = bytes(data)

                    if last.get(report_id) != current:
                        print(
                            f"\nREPORT ID {report_id} CHANGED"
                        )
                        print(
                            "HEX:",
                            " ".join(f"{x:02X}" for x in current)
                        )
                        print(
                            "DEC:",
                            list(current)
                        )

                        last[report_id] = current

            except Exception as e:
                pass

        time.sleep(0.2)

except KeyboardInterrupt:
    print("\n\nStopping...")

finally:
    device.close()

print("Reader closed.")