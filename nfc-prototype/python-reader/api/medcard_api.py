import requests


API_URL = "http://localhost:5000/api/v1"


def identify_card(card_uid):
    """
    Send an NFC card UID to the MedCard backend
    and return the associated patient.
    """

    url = f"{API_URL}/cards/identify"

    payload = {
        "cardUid": card_uid
    }

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=5
        )

        response.raise_for_status()

        return response.json()

    except requests.exceptions.ConnectionError:
        return {
            "success": False,
            "message": "Cannot connect to MedCard backend."
        }

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "message": "MedCard backend request timed out."
        }

    except requests.exceptions.HTTPError:
        try:
            return response.json()
        except Exception:
            return {
                "success": False,
                "message": f"Backend returned HTTP {response.status_code}"
            }

    except Exception as error:
        return {
            "success": False,
            "message": str(error)
        }