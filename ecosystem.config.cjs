module.exports = {
  apps: [
    {
      name: 'TKB_CNTT',
      cwd: '/var/www/tkb-pdu/TKB_CNTT',
      script: 'dist/server.cjs',
      instances: '1',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3005,
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      time: true,
      error_file: '/var/www/tkb-pdu/TKB_CNTT/logs/err.log',
      out_file: '/var/www/tkb-pdu/TKB_CNTT/logs/out.log',
      merge_logs: true,
    },
  ],
};
