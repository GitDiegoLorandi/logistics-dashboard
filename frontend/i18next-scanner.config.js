const fs = require('fs');
const path = require('path');

module.exports = {
  input: [
    'src/**/*.{js,jsx}',
    // Ignore test files
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    // Ignore node_modules
    '!**/node_modules/**',
  ],
  output: './public/locales/',
  options: {
    debug: true,
    removeUnusedKeys: false,
    sort: true,
    func: {
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.js', '.jsx'],
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx'],
    },
    lngs: ['en', 'es'],
    defaultLng: 'en',
    defaultNs: 'common',
    defaultValue: '__STRING_NOT_TRANSLATED__',
    resource: {
      loadPath: 'public/locales/{{lng}}/{{ns}}.json',
      savePath: '{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    nsSeparator: ':',
    keySeparator: '.',
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
  },
  transform: function customTransform(file, enc, done) {
    const parser = this.parser;
    const content = fs.readFileSync(file.path, enc);
    
    // Parse content for translation keys
    parser.parseFuncFromString(content, { list: ['t', 'i18next.t', 'i18n.t'] }, (key, options) => {
      parser.set(key, Object.assign({}, options, {
        nsSeparator: ':',
        keySeparator: '.',
      }));
    });
    
    // Parse Trans components
    parser.parseTransFromString(content, { component: 'Trans', i18nKey: 'i18nKey' }, (key, options) => {
      parser.set(key, Object.assign({}, options, {
        nsSeparator: ':',
        keySeparator: '.',
      }));
    });
    
    done();
  },
}; 