import json
import logging
from time import localtime, strftime
from urllib.parse import quote
from urllib import error, request
import xml.etree.ElementTree as ET

from django.conf import settings

from notifications.models import SMSNotification


logger = logging.getLogger(__name__)


class SMSServiceError(Exception):
    def __init__(self, message, response_data=None, status_code=None):
        super().__init__(message)
        self.response_data = response_data
        self.status_code = status_code


def _load_sms_config():
    config = {
        "url": getattr(settings, "SMS_API_URL", "").strip(),
        "token": getattr(settings, "SMS_API_TOKEN", "").strip(),
        "sender": getattr(settings, "SMS_SENDER", "").strip(),
    }
    missing = [key.upper() for key, value in config.items() if not value]
    if missing:
        raise SMSServiceError(
            f"SMS service not configured. Missing: {', '.join(missing)}",
            response_data={"missing_settings": missing},
        )
    return config


def _decode_response(raw_bytes):
    if not raw_bytes:
        return {}

    text = raw_bytes.decode("utf-8", errors="replace")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            root = ET.fromstring(text)
        except ET.ParseError:
            return {"raw": text}

        response_data = {"raw": text}
        status_node = root.find(".//status")
        if status_node is not None:
            for child in status_node:
                if child.tag and child.text is not None:
                    response_data[child.tag] = child.text.strip()
        return response_data


def _stringify_response_data(response_data):
    if response_data is None:
        return ""

    if isinstance(response_data, dict):
        if isinstance(response_data.get("raw"), str):
            return response_data["raw"]

        try:
            return json.dumps(response_data, ensure_ascii=False)
        except TypeError:
            return str(response_data)

    return str(response_data)


def _normalize_phone(phone):
    digits = "".join(char for char in str(phone or "") if char.isdigit())
    if not digits:
        raise SMSServiceError(
            "Phone number is required.",
            response_data={"phone": ["A valid phone number is required."]},
        )

    if digits.startswith("216"):
        return digits

    return f"216{digits}"


def _build_sms_url(phone, message, config):
    now = localtime()
    normalized_phone = _normalize_phone(phone)
    encoded_message = quote(message, safe="")
    encoded_sender = quote(config["sender"], safe="")
    encoded_date = quote(strftime("%d/%m/%Y", now), safe="")
    encoded_time = quote(strftime("%H:%M", now), safe="")

    # Keep the token format as close as possible to the provider's PHP example.
    return (
        f"{config['url']}?"
        f"fct=sms"
        f"&key={config['token']}"
        f"&mobile={normalized_phone}"
        f"&sms={encoded_message}"
        f"&sender={encoded_sender}"
        f"&date={encoded_date}"
        f"&heure={encoded_time}"
    )


def _sanitize_request_url(url, token):
    return url.replace(token, "***") if token else url


def _response_indicates_failure(response_data):
    status_code = None
    if isinstance(response_data, dict):
        status_code = str(response_data.get("status_code", "")).strip()

    if status_code:
        return status_code != "200"

    normalized = _stringify_response_data(response_data).strip().lower()
    if not normalized:
        return False

    failure_markers = [
        "error",
        "erreur",
        "failed",
        "failure",
        "invalid",
        "denied",
        "unauthorized",
        "forbidden",
        "expired",
        "solde insuffisant",
        "insufficient",
    ]
    return any(marker in normalized for marker in failure_markers)


def _fallback_sms_urls(config):
    fallback_urls = []
    configured_url = config["url"].rstrip("/")

    if configured_url != "https://app.tunisiesms.tn/api/Api.aspx":
        fallback_urls.append("https://app.tunisiesms.tn/api/Api.aspx")

    if configured_url != "https://app.tunisiesms.tn/client/Api/Api.aspx":
        fallback_urls.append("https://app.tunisiesms.tn/client/Api/Api.aspx")

    return fallback_urls


def _perform_sms_request(phone, sms_url, token):
    safe_request_url = _sanitize_request_url(sms_url, token)
    sms_request = request.Request(sms_url, method="GET")

    with request.urlopen(sms_request, timeout=15) as response:
        response_data = _decode_response(response.read())
        if isinstance(response_data, dict):
            response_data["request_url"] = safe_request_url
        else:
            response_data = {
                "raw": str(response_data),
                "request_url": safe_request_url,
            }
        return response_data


def send_sms(phone, message):
    config = _load_sms_config()
    normalized_phone = _normalize_phone(phone)
    candidate_configs = [{"url": config["url"]}] + [{"url": url} for url in _fallback_sms_urls(config)]
    last_error = None

    for candidate in candidate_configs:
        current_config = {
            "url": candidate["url"],
            "token": config["token"],
            "sender": config["sender"],
        }
        sms_url = _build_sms_url(normalized_phone, message, current_config)
        safe_request_url = _sanitize_request_url(sms_url, config["token"])

        try:
            response_data = _perform_sms_request(normalized_phone, sms_url, config["token"])
            logger.info("TunisiaSMS response for %s: %s", normalized_phone, response_data)

            if _response_indicates_failure(response_data):
                logger.error(
                    "TunisiaSMS provider reported a failure for %s on %s: %s",
                    normalized_phone,
                    safe_request_url,
                    response_data,
                )
                last_error = SMSServiceError(
                    "TunisiaSMS provider returned an error response.",
                    response_data=response_data,
                    status_code=502,
                )
                continue

            return response_data
        except error.HTTPError as exc:
            response_data = _decode_response(exc.read())
            if isinstance(response_data, dict):
                response_data["request_url"] = safe_request_url
            logger.exception(
                "TunisiaSMS HTTP error for %s. status=%s url=%s response=%s",
                normalized_phone,
                exc.code,
                safe_request_url,
                response_data,
            )
            last_error = SMSServiceError(
                "TunisiaSMS returned an HTTP error.",
                response_data=response_data,
                status_code=exc.code,
            )
        except error.URLError as exc:
            logger.exception("TunisiaSMS network error for %s on %s: %s", normalized_phone, safe_request_url, exc)
            raise SMSServiceError(
                "TunisiaSMS network error.",
                response_data={"reason": str(exc.reason), "request_url": safe_request_url},
            ) from exc
        except Exception as exc:
            logger.exception("Unexpected TunisiaSMS error for %s on %s", normalized_phone, safe_request_url)
            raise SMSServiceError(
                "Unexpected TunisiaSMS service error.",
                response_data={"detail": str(exc), "request_url": safe_request_url},
            ) from exc

    if last_error:
        raise last_error

    raise SMSServiceError(
        "TunisiaSMS service error.",
        response_data={"detail": "No TunisiaSMS endpoint could process the request."},
        status_code=502,
    )


def _save_sms_attempt(phone, message, statut, api_response=None, collaborateur=None):
    return SMSNotification.objects.create(
        collaborateur=collaborateur,
        telephone=phone,
        message=message,
        statut=statut,
        api_response=api_response,
    )


def send_sms_notification(phone, message, collaborateur=None):
    try:
        response_data = send_sms(phone, message)
        record = _save_sms_attempt(
            phone,
            message,
            SMSNotification.STATUT_SUCCESS,
            api_response=response_data,
            collaborateur=collaborateur,
        )
        return {
            "success": True,
            "record": record,
            "api_response": response_data,
        }
    except SMSServiceError as exc:
        record = _save_sms_attempt(
            phone,
            message,
            SMSNotification.STATUT_FAILED,
            api_response=exc.response_data,
            collaborateur=collaborateur,
        )
        return {
            "success": False,
            "record": record,
            "api_response": exc.response_data,
            "error": str(exc),
            "status_code": exc.status_code,
        }
