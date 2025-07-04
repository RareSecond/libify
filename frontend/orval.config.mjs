export default {
  mynanceApi: {
    input: "../backend/swagger.json",
    output: {
      client: "react-query",
      override: {
        mutator: {
          name: "customInstance",
          path: "./src/data/custom-instance.ts",
        },
      },
      target: "./src/data/api.ts",
    },
  },
};
