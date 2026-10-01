import nextConfig from "eslint-config-next";

const eslintConfig = [...nextConfig, { ignores: ["cockpit/**"] }];

export default eslintConfig;
