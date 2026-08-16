import ctypes
from ctypes import wintypes
from typing import Callable

import win32api
import win32gui


# ============================================================
# WINDOWS RAW INPUT CONSTANTS
# ============================================================

RID_INPUT = 0x10000003
RIM_TYPEKEYBOARD = 1

WM_INPUT = 0x00FF

RI_KEY_BREAK = 0x0001

RIDEV_INPUTSINK = 0x00000100

RIDI_DEVICENAME = 0x20000007


# ============================================================
# MEDCARD NFC READER
# ============================================================

NFC_DEVICE = (
    r"\\?\HID#VID_FFFF&PID_0035&MI_00"
    r"#7&34e23f4d&0&0000"
    r"#{884b96c3-56ef-11d1-bc8c-00a0c91405dd}"
)


# ============================================================
# RAW INPUT STRUCTURES
# ============================================================

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


# ============================================================
# NFC READER CLASS
# ============================================================

class NFCReader:

    def __init__(
        self,
        on_card_detected: Callable[[str], None],
    ):
        self.on_card_detected = on_card_detected
        self.buffer = ""

    # --------------------------------------------------------
    # Get Windows device name
    # --------------------------------------------------------

    def get_device_name(self, device_handle):

        user32 = ctypes.windll.user32

        size = wintypes.UINT(0)

        user32.GetRawInputDeviceInfoW(
            device_handle,
            RIDI_DEVICENAME,
            None,
            ctypes.byref(size),
        )

        if size.value == 0:
            return ""

        buffer = ctypes.create_unicode_buffer(
            size.value + 1
        )

        result = user32.GetRawInputDeviceInfoW(
            device_handle,
            RIDI_DEVICENAME,
            buffer,
            ctypes.byref(size),
        )

        if result == -1:
            return ""

        return buffer.value

    # --------------------------------------------------------
    # Process raw keyboard input
    # --------------------------------------------------------

    def process_input(self, lparam):

        user32 = ctypes.windll.user32

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

        # Ignore anything that isn't a keyboard.
        if raw.header.dwType != RIM_TYPEKEYBOARD:
            return

        device_name = self.get_device_name(
            raw.header.hDevice
        )

        # ====================================================
        # CRITICAL SECURITY FILTER
        #
        # Ignore every keyboard except our NFC reader.
        # ====================================================

        if device_name != NFC_DEVICE:
            return

        keyboard = raw.data.keyboard

        # Ignore key release events.
        if keyboard.Flags & RI_KEY_BREAK:
            return

        vk = keyboard.VKey

        # ----------------------------------------------------
        # ENTER = end of card UID
        # ----------------------------------------------------

        if vk == 0x0D:

            if self.buffer:

                card_uid = self.buffer

                self.buffer = ""

                print()
                print("=" * 60)
                print("NFC CARD DETECTED")
                print("=" * 60)
                print(f"UID: {card_uid}")
                print()

                self.on_card_detected(card_uid)

            return

        # ----------------------------------------------------
        # Number keys
        # ----------------------------------------------------

        if 0x30 <= vk <= 0x39:

            digit = chr(vk)

            self.buffer += digit

            print(
                f"\rReading NFC card: {self.buffer}",
                end="",
                flush=True,
            )

    # --------------------------------------------------------
    # Windows window procedure
    # --------------------------------------------------------

    def window_proc(
        self,
        hwnd,
        msg,
        wparam,
        lparam,
    ):

        if msg == WM_INPUT:

            self.process_input(lparam)

            return 0

        return win32gui.DefWindowProc(
            hwnd,
            msg,
            wparam,
            lparam,
        )

    # --------------------------------------------------------
    # Start reader
    # --------------------------------------------------------

    def start(self):

        print("=" * 60)
        print("MEDCARD NFC SERVICE")
        print("=" * 60)
        print()
        print("NFC reader:")
        print("VID_FFFF / PID_0035")
        print()
        print("Normal keyboard input: IGNORED")
        print("NFC reader input: ACCEPTED")
        print()
        print("Reader service started.")
        print("Waiting for MedCard...")
        print()

        class_name = "MedCardNFCReader"

        wc = win32gui.WNDCLASS()

        wc.lpfnWndProc = self.window_proc

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

        # ----------------------------------------------------
        # Register Raw Input for USB HID keyboards
        # ----------------------------------------------------

        device = RAWINPUTDEVICE(
            usUsagePage=0x01,
            usUsage=0x06,
            dwFlags=RIDEV_INPUTSINK,
            hwndTarget=hwnd,
        )

        user32 = ctypes.windll.user32

        success = user32.RegisterRawInputDevices(
            ctypes.byref(device),
            1,
            ctypes.sizeof(RAWINPUTDEVICE),
        )

        if not success:

            raise ctypes.WinError()

        print("Raw Input registered successfully.")
        print()

        win32gui.PumpMessages()