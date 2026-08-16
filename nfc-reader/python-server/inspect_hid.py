import hid
import sys

VID = 0xFFFF
PID = 0x0035

print("=" * 60)
print("MEDCARD - HID DEVICE INSPECTOR")
print("=" * 60)

devices = hid.enumerate(VID, PID)

for i, d in enumerate(devices):
    print(f"\n[{i}]")
    print("Product       :", d.get("product_string"))
    print("Manufacturer  :", d.get("manufacturer_string"))
    print("Interface     :", d.get("interface_number"))
    print("Usage Page    :", hex(d.get("usage_page", 0)))
    print("Usage         :", hex(d.get("usage", 0)))
    print("Path          :", d.get("path"))

    if d.get("interface_number") == 1:
        print("\n>>> CUSTOM USERDEFHID INTERFACE")

        device = hid.device()

        try:
            device.open_path(d["path"])

            print("Opened successfully.")

            # Try common HID report IDs.
            for report_id in range(0, 8):
                try:
                    data = device.get_feature_report(report_id, 256)

                    if data:
                        print(
                            f"Feature report ID {report_id}: "
                            f"{len(data)} bytes"
                        )
                        print(
                            "HEX:",
                            " ".join(f"{x:02X}" for x in data)
                        )

                except Exception:
                    pass

        except Exception as e:
            print("Open error:", repr(e))

        finally:
            try:
                device.close()
            except:
                pass

print("\nInspection complete.")