"""
Google Sheets parser.

Uses the Google Sheets API to fetch spreadsheet data and build an ArgumentTree.
"""

import pandas as pd

from .base import BaseParser


class GoogleSheetsParser(BaseParser):
    """Parse Google Sheets containing belief/argument data."""

    def read_raw(self, source: str, **kwargs) -> pd.DataFrame:
        """
        Read a Google Sheet into a DataFrame.

        Args:
            source: Google Sheet ID (the long string in the URL).
            **kwargs: Options include:
                credentials_path: Path to Google service account JSON
                    credentials file.
                sheet_range: Sheet name and cell range
                    (default: "Sheet1").
                token_path: Path to store/read OAuth token
                    (default: "token.json").

        Returns:
            Raw DataFrame.
        """
        credentials_path = kwargs.pop("credentials_path", None)
        sheet_range = kwargs.pop("sheet_range", "Sheet1")
        token_path = kwargs.pop("token_path", "token.json")

        service = self._get_sheets_service(credentials_path, token_path)

        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=source, range=sheet_range)
            .execute()
        )
        values = result.get("values", [])

        if not values:
            return pd.DataFrame()

        # First row is headers
        headers = values[0]
        rows = values[1:]

        # Pad short rows with empty strings
        max_cols = len(headers)
        padded_rows = [
            row + [""] * (max_cols - len(row)) for row in rows
        ]

        return pd.DataFrame(padded_rows, columns=headers, dtype=str)

    def _get_sheets_service(self, credentials_path=None, token_path="token.json"):
        """
        Build a Google Sheets API service object.

        Supports two authentication modes:
        1. Service account (credentials_path points to a JSON key file)
        2. OAuth2 desktop flow (will open browser for consent)
        """
        try:
            from google.oauth2 import service_account
            from googleapiclient.discovery import build
        except ImportError:
            raise ImportError(
                "Google API libraries are required for Sheets integration.\n"
                "Install with: pip install google-api-python-client google-auth-oauthlib"
            )

        SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

        if credentials_path and credentials_path.endswith(".json"):
            # Try service account first
            try:
                creds = service_account.Credentials.from_service_account_file(
                    credentials_path, scopes=SCOPES
                )
                return build("sheets", "v4", credentials=creds)
            except Exception:
                pass

        # Fall back to OAuth2 desktop flow
        import os
        from google.auth.transport.requests import Request
        from google_auth_oauthlib.flow import InstalledAppFlow

        creds = None
        if os.path.exists(token_path):
            from google.oauth2.credentials import Credentials
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                if credentials_path is None:
                    raise ValueError(
                        "No credentials provided. Pass credentials_path "
                        "pointing to a Google service account JSON or "
                        "OAuth2 client_secrets.json file."
                    )
                flow = InstalledAppFlow.from_client_secrets_file(
                    credentials_path, SCOPES
                )
                creds = flow.run_local_server(port=0)

            with open(token_path, "w") as token:
                token.write(creds.to_json())

        return build("sheets", "v4", credentials=creds)
