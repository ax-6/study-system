module.exports = {
  apps: [
    {
      name: "study-system",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/study-system",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
