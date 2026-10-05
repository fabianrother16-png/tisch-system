import nextConfig from "eslint-config-next";

// studio/ ist eine eigenständige App mit eigener ESLint-Konfiguration.
const eslintConfig = [...nextConfig, { ignores: ["studio/**"] }];

export default eslintConfig;
