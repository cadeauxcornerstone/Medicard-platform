from api.medcard_api import identify_card
from nfc.reader import NFCReader


def handle_card(card_uid: str):

    print("Sending card UID to MedCard backend...")

    result = identify_card(card_uid)

    print()
    print("Backend response:")
    print(result)

    if result.get("success"):

        patient = (
            result
            .get("data", {})
            .get("patient")
        )

        if patient:

            print()
            print("✓ PATIENT IDENTIFIED")
            print(
                f"Patient: "
                f"{patient.get('firstName')} "
                f"{patient.get('lastName')}"
            )

            print(
                f"Patient number: "
                f"{patient.get('patientNumber')}"
            )

    else:

        print()
        print("✗ CARD IDENTIFICATION FAILED")

    print()
    print("Waiting for next card...")
    print()


def main():

    reader = NFCReader(
        on_card_detected=handle_card
    )

    reader.start()


if __name__ == "__main__":
    main()