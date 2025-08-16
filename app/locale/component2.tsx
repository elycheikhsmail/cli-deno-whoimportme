import { formatDate, isValidEmail } from "../../packages/mytypes/utils.ts";

export function MyComponent2() {
  const email = "test@example.com";
  const isValid = isValidEmail(email);
  const date = formatDate(new Date());
  return <div>Email: {email} is {isValid ? 'valid' : 'invalid'}. Current date: {date}</div>;
}