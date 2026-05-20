module.exports = {
  apps: [
    {
      name: 'wedtech-be',
      script: 'node',
      args: 'dist/main',
      cwd: './',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // Restart on crash, not on memory limit
      max_memory_restart: '512M',
      // Log files
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
