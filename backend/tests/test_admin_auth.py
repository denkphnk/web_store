import unittest
from unittest.mock import patch

from app.core import admin_auth


class AdminAuthTests(unittest.TestCase):
    def test_issued_token_authenticates_configured_admin(self) -> None:
        with patch.multiple(
            admin_auth,
            ADMIN_USERNAME="admin",
            ADMIN_PASSWORD="a-long-admin-password",
            ADMIN_TOKEN_SECRET="s" * 40,
            ADMIN_TOKEN_TTL_SECONDS=300,
        ):
            token = admin_auth.issue_admin_token(
                "admin",
                "a-long-admin-password",
            )

            self.assertEqual(admin_auth.verify_admin_token(token), "admin")

    def test_rejects_tampered_token(self) -> None:
        with patch.multiple(
            admin_auth,
            ADMIN_USERNAME="admin",
            ADMIN_PASSWORD="a-long-admin-password",
            ADMIN_TOKEN_SECRET="s" * 40,
            ADMIN_TOKEN_TTL_SECONDS=300,
        ):
            token = admin_auth.issue_admin_token(
                "admin",
                "a-long-admin-password",
            )
            payload, signature = token.split(".", maxsplit=1)
            tampered_token = f"{payload[:-1]}x.{signature}"

            with self.assertRaises(admin_auth.InvalidAdminToken):
                admin_auth.verify_admin_token(tampered_token)

    def test_rejects_invalid_password(self) -> None:
        with patch.multiple(
            admin_auth,
            ADMIN_USERNAME="admin",
            ADMIN_PASSWORD="a-long-admin-password",
            ADMIN_TOKEN_SECRET="s" * 40,
            ADMIN_TOKEN_TTL_SECONDS=300,
        ):
            with self.assertRaises(admin_auth.InvalidAdminCredentials):
                admin_auth.issue_admin_token("admin", "wrong-password")


if __name__ == "__main__":
    unittest.main()
