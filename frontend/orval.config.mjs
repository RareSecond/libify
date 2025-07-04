export default {
  mynanceApi: {
    input: "../backend/swagger.json",
    output: {
      target: "./src/data/api.ts",
      override: {
        mutator: {
          path: "./src/data/custom-instance.ts",
          name: "customInstance",
        },
      },
      client: "react-query",
    },
  },
};
