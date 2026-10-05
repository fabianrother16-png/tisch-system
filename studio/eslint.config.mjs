import nextConfig from "eslint-config-next";

const eslintConfig = [...nextConfig, { ignores: [".next/**", "data/**"] }];

export default eslintConfig;
