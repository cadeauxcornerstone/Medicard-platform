from api.medcard_api import identify_card
from nfc.reader import NFCReader


def handle_card(card_uid: str, reader: NFCReader):

    print("Sending card UID to MedCard backend...")

    try:

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

            print(
                f"Reason: "
                f"{result.get('message', 'Unknown error')}"
            )

    except Exception as error:

        print()
        print("✗ CARD PROCESSING ERROR")
        print(error)

    finally:

        # ----------------------------------------------------
        # IMPORTANT
        # ----------------------------------------------------
        #
        # The API request is finished.
        #
        # Allow the reader to accept another card.
        #
        # This prevents one failed/finished identification
        # from permanently locking the NFC reader.
        #
        reader.finish_card_processing()

    print()
    print("Waiting for next card...")
    print()


def main():

    reader = NFCReader(
        on_card_detected=None
    )

    # --------------------------------------------------------
    # Connect callback after creating the reader.
    #
    # This gives handle_card() access to the reader so it can
    # release the processing lock when the API request finishes.
    # --------------------------------------------------------

    reader.on_card_detected = (
        lambda card_uid:
            handle_card(
                card_uid,
                reader
            )
    )

    reader.start()


if __name__ == "__main__":
    main()