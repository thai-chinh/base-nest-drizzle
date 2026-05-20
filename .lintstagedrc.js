module.exports = {
  // TypeScript files: lint and format
  '*.ts': ['eslint --fix', 'prettier --write'],

  // JSON, YAML, MD files: format only
  '*.{json,yaml,yml,md}': ['prettier --write'],
};

