import { Redirect } from "expo-router";

export default function StripeCallback() {
  return <Redirect href="/profile/wallet" />;
}
