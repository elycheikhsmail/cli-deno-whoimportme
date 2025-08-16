import { APP_NAME, VERSION } from "../../packages/mytypes/constants.ts";
import { SomeType } from "../../packages/mytypes/types.ts";

export function MyComponent3() {
  return <div>Welcome to {APP_NAME} v{VERSION}</div>;
}