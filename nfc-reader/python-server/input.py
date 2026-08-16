import hid
import time

VID = 0xFFFF
PID = 0x0035

devices = hid.enumerate(VID, PID)

reader = next(
    d for d in devices
    if d.get("interface_number") == 1
)

device = hid.device()
device.open_path(reader["path"])

print("Connected:", device.get_product_string())
print("Waiting for input reports...")
print("Tap/remove the card several times.")
print("Press Ctrl+C to stop.")

try:
    # Try a few common report sizes.
    for size in [8, 16, 32, 64, 65, 128]:
        print(f"Testing input report size: {size}")

        device.set_nonblocking(False)

        try:
            data = device.read(size, timeout_ms=500)

            if data:
                print(
                    "RECEIVED:",
                    " ".join(f"{b:02X}" for b in data)
                )

        except Exception as e:
            print("  error:", repr(e))

except KeyboardInterrupt:
    print("\nStopped.")

finally:
    device.close()python -c "import hid; print(hid.__version__); print(hid.__file__)"python -c "import hid; print(hid.__version__); print(hid.__file__)"python -c "import hid; print(hid.__version__); print(hid.__file__)"python -c "import hid; print(hid.__version__); print(hid.__file__)"python -c "import hid; print(hid.__version__); print(hid.__file__)"python -c "import hid; print(hid.__version__); print(hid.__file__)"