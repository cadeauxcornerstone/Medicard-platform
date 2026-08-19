import ctypes
from ctypes import wintypes
import win32con
import win32gui
import win32api


user32 = ctypes.windll.user32


# ---------------------------------------------------------
# Windows Raw Input constants
# ---------------------------------------------------------

RID_INPUT = 0x10000003
RIM_TYPEKEYBOARD = 1

WM_INPUT = 0x00FF

RI_KEY_BREAK = 0x0001

RIDEV_INPUTSINK = 0x00000100

RID_INPUT_DEVICE = 0x10000001
RIDI_DEVICENAME = 0x20000007

# ---------------------------------------------------------
# Raw Input structures
#
class RAWINPUTDEVICE(ctypes.Structure):
    _fields_ = [
        ("usUsagePage", wintypes.USHORT),
        ("usUsage", wintypes.USHORT),
        ("dwFlags", wintypes.DWORD),
        ("hwndTarget", wintypes.HWND),
    ]


class RAWINPUTHEADER(ctypes.Structure):
    _fields_ = [
        ("dwType", wintypes.DWORD),
        ("dwSize", wintypes.DWORD),
        ("hDevice", wintypes.HANDLE),
        ("wParam", wintypes.WPARAM),
    ]


class RAWKEYBOARD(ctypes.Structure):
    _fields_ = [
        ("MakeCode", wintypes.USHORT),
        ("Flags", wintypes.USHORT),
        ("Reserved", wintypes.USHORT),
        ("VKey", wintypes.USHORT),
        ("Message", wintypes.UINT),
        ("ExtraInformation", wintypes.ULONG),
    ]


class RAWINPUTUNION(ctypes.Union):
    _fields_ = [
        ("keyboard", RAWKEYBOARD),
    ]


class RAWINPUT(ctypes.Structure):
    _fields_ = [
        ("header", RAWINPUTHEADER),
        ("data", RAWINPUTUNION),
    ]


# ---------------------------------------------------------
# Get device name
# ---------------------------------------------------------

def get_device_name(device_handle):
    size = wintypes.UINT(0)

    user32.GetRawInputDeviceInfoW(
        device_handle,
        RIDI_DEVICENAME,
        None,
        ctypes.byref(size),
    )

    if size.value == 0:
        return "UNKNOWN"

    buffer = ctypes.create_unicode_buffer(size.value + 1)

    result = user32.GetRawInputDeviceInfoW(
        device_handle,
        RIDI_DEVICENAME,
        buffer,
        ctypes.byref(size),
    )

    if result == -1:
        return "UNKNOWN"

    return buffer.value


# ---------------------------------------------------------
# Read raw input
# ---------------------------------------------------------

def process_raw_input(lparam):
    size = wintypes.UINT(0)

    result = user32.GetRawInputData(
        lparam,
        RID_INPUT,
        None,
        ctypes.byref(size),
        ctypes.sizeof(RAWINPUTHEADER),
    )

    if result == -1 or size.value == 0:
        return

    buffer = ctypes.create_string_buffer(size.value)

    result = user32.GetRawInputData(
        lparam,
        RID_INPUT,
        buffer,
        ctypes.byref(size),
        ctypes.sizeof(RAWINPUTHEADER),
    )

    if result == -1:
        return

    raw = ctypes.cast(
        buffer,
        ctypes.POINTER(RAWINPUT)
    ).contents

    if raw.header.dwType != RIM_TYPEKEYBOARD:
        return

    keyboard = raw.data.keyboard

    # Ignore key release events
    if keyboard.Flags & RI_KEY_BREAK:
        return

    device_name = get_device_name(
        raw.header.hDevice
    )

    vk = keyboard.VKey

    if 0x30 <= vk <= 0x39:
        char = chr(vk)
    else:
        char = f"VK_{vk:02X}"

    print()
    print("=" * 80)
    print("RAW INPUT DEVICE DETECTED")
    print("=" * 80)
    print(f"Device : {device_name}")
    print(f"VKey   : {vk}")
    print(f"Input  : {char}")
    print("=" * 80)


# ---------------------------------------------------------
# Window procedure
# ---------------------------------------------------------

def window_proc(hwnd, msg, wparam, lparam):

    if msg == WM_INPUT:
        process_raw_input(lparam)
        return 0

    return win32gui.DefWindowProc(
        hwnd,
        msg,
        wparam,
        lparam,
    )


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

def main():

    print("=" * 80)
    print("MEDCARD RAW INPUT DEVICE IDENTIFICATION")
    print("=" * 80)
    print()
    print("This program is listening for RAW keyboard input.")
    print()
    print("TEST 1:")
    print("Type a few numbers on your NORMAL keyboard.")
    print()
    print("TEST 2:")
    print("Tap your NFC card.")
    print()
    print("We will compare the DEVICE paths.")
    print()
    print("Press Ctrl+C to stop.")
    print("=" * 80)

    class_name = "MedCardRawInputDiagnostic"

    wc = win32gui.WNDCLASS()
    wc.lpfnWndProc = window_proc
    wc.lpszClassName = class_name
    wc.hInstance = win32api.GetModuleHandle(None)

    atom = win32gui.RegisterClass(wc)

    hwnd = win32gui.CreateWindow(
        atom,
        class_name,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        wc.hInstance,
        None,
    )

    # USB HID keyboard
    device = RAWINPUTDEVICE(
        usUsagePage=0x01,
        usUsage=0x06,
        dwFlags=RIDEV_INPUTSINK,
        hwndTarget=hwnd,
    )

    success = user32.RegisterRawInputDevices(
        ctypes.byref(device),
        1,
        ctypes.sizeof(RAWINPUTDEVICE),
    )

    if not success:
        raise ctypes.WinError()

    print()
    print("Raw Input listener started.")
    print("Waiting for keyboard/NFC input...")
    print()

    win32gui.PumpMessages()


if __name__ == "__main__":
    main()