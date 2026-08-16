import hid
import time

VID = 0xFFFF
PID = 0x0035

devices = hid.enumerate(VID, PID)

reader = next(
    d for d in devices
    if d.get("interface_number") == 1
    and d.get("usage_page") == 0xFFA0
)

print("=" * 60)
print("MEDCARD HID INPUT PROBE")
print("=" * 60)

print("Path:", reader["path"])

device = hid.device()
device.open_path(reader["path"])

print("✅ Opened")
print("Product:", device.get_product_string())
print()

# Important: don't use nonblocking mode.
device.set_nonblocking(False)

print("Waiting for an input report...")
print("Tap the NFC card.")
print("Press Ctrl+C to stop.")
print()

try:
    while True:
        try:
            # 15 is significant because the feature report
            # returned 15 bytes.
            data = device.read(15)

            if data:
                print(
                    "INPUT:",
                    " ".join(f"{b:02X}" for b in data)
                )

        except Exception as e:
            print("READ ERROR:", repr(e))
            time.sleep(1)

except KeyboardInterrupt:
    print("\nStopped.")

finally:
    device.close()