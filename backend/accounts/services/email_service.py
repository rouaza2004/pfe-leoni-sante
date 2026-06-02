from django.conf import settings
from django.core.mail import send_mail


def build_login_url():
    return getattr(settings, "FRONTEND_LOGIN_URL", "").strip() or "http://localhost:5173/login"


def build_new_user_credentials_message(user, generated_password):
    return "\n".join(
        [
            f"Bonjour {user.get_full_name() or user.username},",
            "",
            "Votre compte utilisateur sur la plateforme sante a ete cree.",
            f"Username : {user.username}",
            f"Mot de passe : {generated_password}",
            f"Lien de connexion : {build_login_url()}",
            "",
            "Merci de changer votre mot de passe apres votre premiere connexion.",
        ]
    )


def send_new_user_credentials_email(user, generated_password):
    send_email(
        to_email=user.email,
        subject="Votre compte a ete cree",
        message=build_new_user_credentials_message(user, generated_password),
    )


def send_email(to_email, subject, message):
    send_mail(
        subject,
        message,
        getattr(settings, "DEFAULT_FROM_EMAIL", "test@example.com"),
        [to_email],
        fail_silently=False,
    )

