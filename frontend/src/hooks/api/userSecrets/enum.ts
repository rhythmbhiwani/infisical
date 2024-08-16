export const enum UserSecretType {
  WEB_LOGIN = "web_login",
  CREDIT_CARD = "credit_card",
  SECURE_NOTE = "secure_note",
  WIFI = "wifi"
}

export const userSecretTypeOptions = [
  { label: "Login Credentials", value: UserSecretType.WEB_LOGIN },
  { label: "Credit Card", value: UserSecretType.CREDIT_CARD },
  { label: "Secure Note", value: UserSecretType.SECURE_NOTE },
  { label: "Wifi Password", value: UserSecretType.WIFI }
];
