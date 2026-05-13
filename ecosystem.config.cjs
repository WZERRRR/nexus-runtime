module.exports = {
  apps: [{
    name: "nexus-runtime",
    script: "./server.ts",
    interpreter: "npx",
    interpreter_args: "tsx",
    watch: false,
    env: {
      NODE_ENV: "development",
      PORT: 3010,
      HOST: "0.0.0.0"
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3010,
      HOST: "0.0.0.0"
    },
    // Runtime Boot Integrity checks
    max_memory_restart: '1G',
    wait_ready: true,      // Ensures PM2 waits for the application to be ready
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
