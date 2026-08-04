'use strict';
module.exports = {
  ...require('./html-audit'),
  ...require('./nextjs-audit'),
  ...require('./crawlability'),
  ...require('./ssr-analysis'),
  ...require('./web-vitals'),
  ...require('./i18n-seo')
};
